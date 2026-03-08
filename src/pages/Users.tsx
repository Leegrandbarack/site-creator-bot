import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Search, Loader2, UserPlus, Clock, UserCheck } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_online?: boolean;
}

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [friendStatuses, setFriendStatuses] = useState<Map<string, { status: FriendStatus; id?: string }>>(new Map());
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", firstName: "U", avatar: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const uid = session.user.id;
      setCurrentUserId(uid);

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", uid)
        .maybeSingle();
      if (myProfile) {
        const name = [myProfile.first_name, myProfile.last_name].filter(Boolean).join(" ") || "Utilisateur";
        setUserInfo({ name, firstName: myProfile.first_name || "U", avatar: myProfile.avatar_url || "" });
      }

      const [{ data: profiles }, { data: presence }, { data: friendships }] = await Promise.all([
        supabase.from("profiles").select("id, user_id, first_name, last_name, avatar_url, bio").neq("user_id", uid).not("first_name", "is", null).neq("first_name", ""),
        supabase.from("user_presence").select("user_id, is_online"),
        supabase.from("friendships").select("*").or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
      ]);

      const presenceMap = new Map(presence?.map(p => [p.user_id, p.is_online]) || []);
      setUsers((profiles || []).map(p => ({ ...p, is_online: presenceMap.get(p.user_id) || false })));

      const statusMap = new Map<string, { status: FriendStatus; id?: string }>();
      (friendships || []).forEach(f => {
        const otherId = f.requester_id === uid ? f.addressee_id : f.requester_id;
        if (f.status === "accepted") statusMap.set(otherId, { status: "accepted", id: f.id });
        else if (f.status === "pending" && f.requester_id === uid) statusMap.set(otherId, { status: "pending_sent", id: f.id });
        else if (f.status === "pending" && f.addressee_id === uid) statusMap.set(otherId, { status: "pending_received", id: f.id });
      });
      setFriendStatuses(statusMap);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleMessage = async (targetUserId: string) => {
    if (!currentUserId) return;
    setNavigatingTo(targetUserId);
    const { data: myConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", currentUserId);
    const { data: theirConvos } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", targetUserId);
    const myIds = new Set(myConvos?.map(c => c.conversation_id) || []);
    const shared = theirConvos?.find(c => myIds.has(c.conversation_id))?.conversation_id;
    if (shared) { navigate(`/messages?conversation=${shared}`); return; }
    const { data: convId } = await supabase.rpc("create_conversation_with_participant", { other_user_id: targetUserId });
    if (convId) navigate(`/messages?conversation=${convId}`);
    setNavigatingTo(null);
  };

  const handleAddFriend = async (targetUserId: string) => {
    if (!currentUserId) return;
    setProcessingIds(prev => new Set(prev).add(targetUserId));
    try {
      const { data, error } = await supabase.from("friendships").insert({
        requester_id: currentUserId, addressee_id: targetUserId,
      }).select().single();
      if (error) throw error;
      await supabase.from("notifications").insert({
        user_id: targetUserId, type: "friend_request",
        message: "vous a envoyé une demande d'ami", from_user_id: currentUserId, reference_id: data.id,
      });
      setFriendStatuses(prev => new Map(prev).set(targetUserId, { status: "pending_sent", id: data.id }));
      toast.success("Demande d'ami envoyée !", { icon: "👋" });
    } catch { toast.error("Erreur"); }
    finally { setProcessingIds(prev => { const n = new Set(prev); n.delete(targetUserId); return n; }); }
  };

  const filtered = users.filter(u => {
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardNavbar user={userInfo} />
      <div className="pt-14 max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <button
            onClick={() => navigate("/friends")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Demandes d'amis
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Rechercher des utilisateurs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 h-11 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Aucun utilisateur trouvé</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((u, i) => {
              const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Utilisateur";
              const isNavigating = navigatingTo === u.user_id;
              const friendInfo = friendStatuses.get(u.user_id);
              const friendStatus = friendInfo?.status || "none";
              const isProcessing = processingIds.has(u.user_id);

              return (
                <div
                  key={u.id}
                  className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border/40 hover:shadow-[0_4px_20px_hsl(var(--foreground)/0.06)] transition-all duration-300 group"
                  style={{ animation: `userSlideIn 0.25s ease-out ${i * 40}ms both` }}
                >
                  <div className="relative cursor-pointer" onClick={() => navigate(`/profile/${u.user_id}`)}>
                    <Avatar className="w-14 h-14 ring-2 ring-transparent group-hover:ring-primary/15 transition-all">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-bold">
                        {(u.first_name?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {u.is_online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-[2.5px] border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate text-[15px]">{name}</p>
                    {u.bio && <p className="text-xs text-muted-foreground truncate mt-0.5">{u.bio}</p>}
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {u.is_online ? (
                        <><span className="w-2 h-2 bg-green-500 rounded-full" /> En ligne</>
                      ) : "Hors ligne"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Friend action button */}
                    {friendStatus === "none" && (
                      <button
                        onClick={() => handleAddFriend(u.user_id)}
                        disabled={isProcessing}
                        className="px-3.5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-[0_2px_8px_hsl(var(--primary)/0.25)] disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        <span className="hidden sm:inline">Ajouter</span>
                      </button>
                    )}
                    {friendStatus === "pending_sent" && (
                      <span className="px-3.5 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span className="hidden sm:inline">Envoyée</span>
                      </span>
                    )}
                    {friendStatus === "pending_received" && (
                      <button
                        onClick={() => navigate("/friends")}
                        className="px-3.5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Répondre</span>
                      </button>
                    )}
                    {friendStatus === "accepted" && (
                      <span className="px-3.5 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm font-medium flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" />
                        <span className="hidden sm:inline">Ami(e)</span>
                      </span>
                    )}

                    {/* Message button */}
                    <button
                      onClick={() => handleMessage(u.user_id)}
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all active:scale-95"
                      title="Envoyer un message"
                    >
                      {isNavigating ? (
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <MessageCircle className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes userSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Users;
