import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserPlus, UserCheck, UserX, Users, Clock, Search, Loader2, Check, X, MessageCircle, ChevronRight
} from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { toast } from "sonner";

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface FriendRequest {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
  profile?: UserProfile;
}

type Tab = "requests" | "suggestions" | "friends";

const Friends = () => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", firstName: "U", avatar: "" });
  const navigate = useNavigate();

  const fetchData = useCallback(async (userId: string) => {
    // Fetch incoming requests
    const { data: incoming } = await supabase
      .from("friendships")
      .select("*")
      .eq("addressee_id", userId)
      .eq("status", "pending");

    // Fetch accepted friends
    const { data: accepted } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

    // Fetch sent requests
    const { data: sent } = await supabase
      .from("friendships")
      .select("*")
      .eq("requester_id", userId)
      .eq("status", "pending");

    const sentSet = new Set((sent || []).map(s => s.addressee_id));
    setSentRequests(sentSet);

    // Collect all user IDs we need profiles for
    const allUserIds = new Set<string>();
    (incoming || []).forEach(r => allUserIds.add(r.requester_id));
    (accepted || []).forEach(r => {
      allUserIds.add(r.requester_id === userId ? r.addressee_id : r.requester_id);
    });

    // Fetch profiles
    const userIdArray = [...allUserIds];
    let profileMap = new Map<string, UserProfile>();
    if (userIdArray.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url, bio")
        .in("user_id", userIdArray);
      profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    }

    const incomingWithProfile = (incoming || []).map(r => ({
      ...r,
      profile: profileMap.get(r.requester_id),
    })).filter(r => r.profile?.first_name);

    const acceptedWithProfile = (accepted || []).map(r => {
      const otherId = r.requester_id === userId ? r.addressee_id : r.requester_id;
      return { ...r, profile: profileMap.get(otherId) };
    }).filter(r => r.profile?.first_name);

    setRequests(incomingWithProfile);
    setFriends(acceptedWithProfile);

    // Fetch suggestions (users not already friends or requested)
    const excludeIds = new Set<string>([userId]);
    (incoming || []).forEach(r => excludeIds.add(r.requester_id));
    (accepted || []).forEach(r => {
      excludeIds.add(r.requester_id);
      excludeIds.add(r.addressee_id);
    });
    sentSet.forEach(id => excludeIds.add(id));

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url, bio")
      .not("first_name", "is", null)
      .neq("first_name", "");

    setSuggestions((allProfiles || []).filter(p => !excludeIds.has(p.user_id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setCurrentUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur";
        setUserInfo({ name, firstName: profile.first_name || "U", avatar: profile.avatar_url || "" });
      }

      fetchData(session.user.id);
    };
    init();
  }, [navigate, fetchData]);

  const addProcessing = (id: string) => setProcessingIds(prev => new Set(prev).add(id));
  const removeProcessing = (id: string) => setProcessingIds(prev => { const n = new Set(prev); n.delete(id); return n; });

  const handleSendRequest = async (targetUserId: string) => {
    if (!currentUserId) return;
    addProcessing(targetUserId);
    try {
      const { data, error } = await supabase.from("friendships").insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
      }).select().single();
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "friend_request",
        message: "vous a envoyé une demande d'ami",
        from_user_id: currentUserId,
        reference_id: data.id,
      });

      setSentRequests(prev => new Set(prev).add(targetUserId));
      toast.success("Demande d'ami envoyée !", { icon: "👋" });
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      removeProcessing(targetUserId);
    }
  };

  const handleAccept = async (request: FriendRequest) => {
    addProcessing(request.id);
    try {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", request.id);
      await supabase.from("notifications").insert({
        user_id: request.requester_id,
        type: "friend_accepted",
        message: "a accepté votre demande d'ami",
        from_user_id: currentUserId!,
        reference_id: request.id,
      });
      setConfirmedIds(prev => new Set(prev).add(request.id));
      toast.success(`Vous êtes maintenant ami(e) avec ${request.profile?.first_name} !`, { icon: "🎉" });
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== request.id));
        if (currentUserId) fetchData(currentUserId);
      }, 1500);
    } catch {
      toast.error("Erreur");
    } finally {
      removeProcessing(request.id);
    }
  };

  const handleReject = async (request: FriendRequest) => {
    addProcessing(request.id);
    try {
      await supabase.from("friendships").delete().eq("id", request.id);
      setRemovedIds(prev => new Set(prev).add(request.id));
      toast("Demande supprimée", { icon: "🗑️" });
      setTimeout(() => {
        setRequests(prev => prev.filter(r => r.id !== request.id));
      }, 500);
    } catch {
      toast.error("Erreur");
    } finally {
      removeProcessing(request.id);
    }
  };

  const handleRemoveFriend = async (friendship: FriendRequest) => {
    addProcessing(friendship.id);
    try {
      await supabase.from("friendships").delete().eq("id", friendship.id);
      setRemovedIds(prev => new Set(prev).add(friendship.id));
      toast("Ami supprimé", { icon: "👋" });
      setTimeout(() => {
        setFriends(prev => prev.filter(f => f.id !== friendship.id));
      }, 500);
    } catch {
      toast.error("Erreur");
    } finally {
      removeProcessing(friendship.id);
    }
  };

  const handleMessage = async (targetUserId: string) => {
    if (!currentUserId) return;
    const { data: myConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);
    const { data: theirConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetUserId);
    const myIds = new Set(myConvos?.map(c => c.conversation_id) || []);
    const shared = theirConvos?.find(c => myIds.has(c.conversation_id))?.conversation_id;
    if (shared) { navigate(`/messages?conversation=${shared}`); return; }
    const { data: convId } = await supabase.rpc("create_conversation_with_participant", { other_user_id: targetUserId });
    if (convId) navigate(`/messages?conversation=${convId}`);
  };

  const getName = (p?: UserProfile) => p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Utilisateur" : "Utilisateur";

  const filterBySearch = (p?: UserProfile) => {
    if (!search) return true;
    return getName(p).toLowerCase().includes(search.toLowerCase());
  };

  const tabs: { key: Tab; label: string; icon: typeof Users; count?: number }[] = [
    { key: "requests", label: "Demandes", icon: UserPlus, count: requests.length },
    { key: "suggestions", label: "Suggestions", icon: Users },
    { key: "friends", label: "Mes amis", icon: UserCheck, count: friends.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen pb-14 lg:pb-0 bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNavbar user={userInfo} />
      <div className="pt-14 max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" /> Amis
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shrink-0 active:scale-95 ${
                tab === key
                  ? "bg-primary text-primary-foreground shadow-[0_2px_10px_hsl(var(--primary)/0.35)]"
                  : "bg-card text-foreground hover:bg-muted border border-border/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  tab === key ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 h-11 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* REQUESTS TAB */}
        {tab === "requests" && (
          <div className="space-y-3">
            {requests.filter(r => filterBySearch(r.profile)).length === 0 ? (
              <EmptyState icon={UserPlus} text="Aucune demande d'ami en attente" />
            ) : (
              requests.filter(r => filterBySearch(r.profile)).map((req, i) => {
                const name = getName(req.profile);
                const isProcessing = processingIds.has(req.id);
                const isRemoved = removedIds.has(req.id);
                const isConfirmed = confirmedIds.has(req.id);

                return (
                  <div
                    key={req.id}
                    className={`bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/40 transition-all duration-500 ${
                      isRemoved ? "opacity-0 -translate-x-10 scale-95" : isConfirmed ? "opacity-0 translate-x-10 scale-95 bg-green-50" : "hover:shadow-[0_4px_20px_hsl(var(--foreground)/0.06)]"
                    }`}
                    style={{ animation: `cardSlideIn 0.3s ease-out ${i * 60}ms both` }}
                  >
                    <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${req.requester_id}`)}>
                      <Avatar className="w-16 h-16 ring-2 ring-primary/10 hover:ring-primary/30 transition-all">
                        <AvatarImage src={req.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
                          {name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-[15px] truncate">{name}</p>
                      {req.profile?.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{req.profile.bio}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(req.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isConfirmed ? (
                        <span className="text-green-600 font-semibold text-sm flex items-center gap-1 animate-scale-in">
                          <Check className="w-4 h-4" /> Ami ajouté !
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAccept(req)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-[0_2px_8px_hsl(var(--primary)/0.3)] disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirmer
                          </button>
                          <button
                            onClick={() => handleReject(req)}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-destructive/10 hover:text-destructive transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" /> Supprimer
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SUGGESTIONS TAB */}
        {tab === "suggestions" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.filter(s => filterBySearch(s)).length === 0 ? (
              <div className="col-span-full">
                <EmptyState icon={Users} text="Aucune suggestion pour le moment" />
              </div>
            ) : (
              suggestions.filter(s => filterBySearch(s)).map((user, i) => {
                const name = getName(user);
                const isSent = sentRequests.has(user.user_id);
                const isProcessing = processingIds.has(user.user_id);

                return (
                  <div
                    key={user.user_id}
                    className="bg-card rounded-2xl overflow-hidden border border-border/40 hover:shadow-[0_8px_30px_hsl(var(--foreground)/0.08)] transition-all duration-300 group"
                    style={{ animation: `cardSlideUp 0.3s ease-out ${i * 40}ms both` }}
                  >
                    {/* Cover area */}
                    <div className="h-20 bg-gradient-to-br from-primary/10 via-primary/5 to-muted relative">
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                        <Avatar
                          className="w-16 h-16 ring-4 ring-card cursor-pointer group-hover:ring-primary/20 transition-all"
                          onClick={() => navigate(`/profile/${user.user_id}`)}
                        >
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-lg">
                            {name[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                    <div className="pt-10 pb-4 px-4 text-center">
                      <p className="font-semibold text-foreground text-[15px] truncate">{name}</p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</p>
                      )}
                      <div className="mt-4">
                        {isSent ? (
                          <button
                            disabled
                            className="w-full px-4 py-2.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-default"
                          >
                            <Clock className="w-4 h-4" /> Demande envoyée
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(user.user_id)}
                            disabled={isProcessing}
                            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all duration-200 active:scale-[0.97] shadow-[0_2px_8px_hsl(var(--primary)/0.3)] hover:shadow-[0_4px_14px_hsl(var(--primary)/0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isProcessing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserPlus className="w-4 h-4" />
                            )}
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* FRIENDS TAB */}
        {tab === "friends" && (
          <div className="space-y-3">
            {friends.filter(f => filterBySearch(f.profile)).length === 0 ? (
              <EmptyState icon={UserCheck} text="Aucun ami pour le moment" />
            ) : (
              friends.filter(f => filterBySearch(f.profile)).map((friendship, i) => {
                const name = getName(friendship.profile);
                const isRemoved = removedIds.has(friendship.id);
                const otherId = friendship.requester_id === currentUserId ? friendship.addressee_id : friendship.requester_id;

                return (
                  <div
                    key={friendship.id}
                    className={`bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/40 transition-all duration-500 ${
                      isRemoved ? "opacity-0 scale-95 -translate-x-10" : "hover:shadow-[0_4px_20px_hsl(var(--foreground)/0.06)]"
                    }`}
                    style={{ animation: `cardSlideIn 0.3s ease-out ${i * 60}ms both` }}
                  >
                    <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${otherId}`)}>
                      <Avatar className="w-14 h-14 ring-2 ring-transparent hover:ring-primary/20 transition-all">
                        <AvatarImage src={friendship.profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                          {name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{name}</p>
                      {friendship.profile?.bio && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{friendship.profile.bio}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMessage(otherId)}
                        className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95"
                        title="Envoyer un message"
                      >
                        <MessageCircle className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => handleRemoveFriend(friendship)}
                        disabled={processingIds.has(friendship.id)}
                        className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
                        title="Retirer cet ami"
                      >
                        {processingIds.has(friendship.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes cardSlideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes cardSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <MobileBottomNav />
    </div>
  );
};

const EmptyState = ({ icon: Icon, text }: { icon: typeof Users; text: string }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <div className="w-20 h-20 rounded-full bg-muted/60 flex items-center justify-center">
      <Icon className="w-9 h-9 text-muted-foreground/50" />
    </div>
    <p className="text-sm text-muted-foreground font-medium">{text}</p>
  </div>
);

export default Friends;
