import { useState, useEffect } from "react";
import { UserPlus, MessageCircle, UserCheck, Camera, Edit3, Clock, Check, X, MoreHorizontal, Plus, MapPin, Search, ChevronLeft, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useFriendship } from "@/hooks/useFriendship";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  profileUserId: string;
  currentUserId: string;
  isOwnProfile: boolean;
}

interface ProfileData {
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  username: string | null;
  email: string;
}

const ProfileHeader = ({ profileUserId, currentUserId, isOwnProfile }: ProfileHeaderProps) => {
  const {
    status, isLoading, friendsCount,
    sendRequest, acceptRequest, rejectRequest, removeFriend,
  } = useFriendship(currentUserId, profileUserId);
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [postsCount, setPostsCount] = useState(0);
  const [mutualAvatars, setMutualAvatars] = useState<string[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [coverHover, setCoverHover] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, bio, avatar_url, username, email")
        .eq("user_id", profileUserId)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setEditBio(data.bio || "");
      }
      const { count } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profileUserId);
      setPostsCount(count || 0);

      // Fetch a few friend avatars for the mutual-friends strip
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profileUserId},addressee_id.eq.${profileUserId}`)
        .limit(6);
      if (friendships && friendships.length) {
        const ids = friendships.map((f) =>
          f.requester_id === profileUserId ? f.addressee_id : f.requester_id
        );
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, avatar_url")
          .in("user_id", ids)
          .limit(3);
        setMutualAvatars((profs || []).map((p) => p.avatar_url || `https://i.pravatar.cc/100?u=${p.user_id}`));
      }
    };
    fetchAll();
  }, [profileUserId]);

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.username || "Utilisateur"
    : "Utilisateur";

  const avatarUrl = profile?.avatar_url || undefined;
  const coverUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=940&h=350&fit=crop";

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Vous ne suivez plus cet utilisateur" : "Vous suivez cet utilisateur !");
  };

  const saveBio = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({ bio: editBio })
      .eq("user_id", currentUserId);
    if (!error) {
      setProfile((p) => p ? { ...p, bio: editBio } : p);
      setIsEditingBio(false);
      toast.success("Bio mise à jour !");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop();
    const path = `avatars/${currentUserId}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("post-images").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("Erreur upload"); return; }
    const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", currentUserId);
    setProfile((p) => p ? { ...p, avatar_url: urlData.publicUrl } : p);
    toast.success("Photo de profil mise à jour !");
  };

  const handleFriendAction = async () => {
    if (status === "none") { await sendRequest(); toast.success("Demande d'ami envoyée !"); }
    else if (status === "accepted") { await removeFriend(); toast.success("Ami retiré"); }
    else if (status === "pending_sent") { await rejectRequest(); toast.success("Demande annulée"); }
  };

  const renderFriendButton = () => {
    if (isOwnProfile) return null;
    switch (status) {
      case "none":
        return (
          <Button onClick={handleFriendAction} disabled={isLoading} className="rounded-lg gap-2">
            <UserPlus className="w-4 h-4" /> Ajouter
          </Button>
        );
      case "pending_sent":
        return (
          <Button onClick={handleFriendAction} disabled={isLoading} variant="outline" className="rounded-lg gap-2">
            <Clock className="w-4 h-4" /> Demande envoyée
          </Button>
        );
      case "pending_received":
        return (
          <div className="flex gap-1">
            <Button onClick={async () => { await acceptRequest(); toast.success("Ami ajouté !"); }} disabled={isLoading} className="rounded-lg gap-1.5 text-sm">
              <Check className="w-4 h-4" /> Accepter
            </Button>
            <Button onClick={async () => { await rejectRequest(); toast.success("Demande refusée"); }} disabled={isLoading} variant="outline" className="rounded-lg gap-1.5 text-sm">
              <X className="w-4 h-4" /> Refuser
            </Button>
          </div>
        );
      case "accepted":
        return (
          <Button onClick={handleFriendAction} disabled={isLoading} variant="secondary" className="rounded-lg gap-2">
            <UserCheck className="w-4 h-4" /> Ami(e)
          </Button>
        );
    }
  };

  const formattedFriends = friendsCount >= 1000
    ? `${(friendsCount / 1000).toFixed(1).replace(".", ",")} K`
    : `${friendsCount}`;

  return (
    <div className="bg-card">
      {/* ========== MOBILE (Facebook clone) ========== */}
      <div className="lg:hidden">
        {/* Cover */}
        <div className="relative h-[210px] w-full overflow-hidden">
          <img src={coverUrl} alt="Couverture" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />
          <button onClick={() => navigate(-1)} className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <ChevronLeft className="w-6 h-6 text-white" strokeWidth={2.5} />
          </button>
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button onClick={() => navigate("/users")} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
            <button className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" strokeWidth={2.5} />
            </button>
          </div>
          {isOwnProfile && (
            <button className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-card flex items-center justify-center shadow">
              <Camera className="w-5 h-5 text-foreground" />
            </button>
          )}
        </div>

        {/* White card with avatar overlapping */}
        <div className="relative bg-card rounded-t-3xl -mt-6 pt-2 pb-3 px-4">
          <div className="relative flex flex-col items-center">
            {/* Avatar */}
            <div className="relative -mt-20 mb-3">
              <div className="p-1 bg-card rounded-full">
                <Avatar className="w-[150px] h-[150px]">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-5xl bg-muted">{displayName[0]}</AvatarFallback>
                </Avatar>
              </div>
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 w-9 h-9 bg-muted rounded-full flex items-center justify-center shadow-md cursor-pointer ring-4 ring-card">
                  <Camera className="w-5 h-5 text-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
              {/* Feeling pill (decorative) */}
              <div className="absolute -top-2 left-1/2 -translate-x-[110%] bg-card rounded-full pl-3 pr-4 py-2 shadow-md text-[13px] text-muted-foreground whitespace-nowrap">
                Ressenti actuel...
              </div>
            </div>

            {/* Name + chevron */}
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] leading-tight font-bold text-foreground">{displayName}</h1>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                <ChevronDown className="w-5 h-5 text-foreground" />
              </button>
            </div>

            {/* Friends · Publications */}
            <p className="mt-1 text-[15px] text-muted-foreground font-medium">
              <span className="text-foreground font-bold">{formattedFriends}</span> ami(e)s · <span className="text-foreground font-bold">{postsCount}</span> publications
            </p>

            {/* Location row */}
            <p className="mt-2 text-[14px] text-foreground font-medium flex items-center gap-1.5 text-center">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="font-bold">Parakou</span>
              <span className="text-muted-foreground">·</span>
              <span className="font-bold">Nexora</span>
            </p>

            {/* Mutual friends strip */}
            {mutualAvatars.length > 0 && (
              <div className="mt-3 flex items-center gap-3 w-full">
                <div className="flex -space-x-2">
                  {mutualAvatars.slice(0, 3).map((a, i) => (
                    <Avatar key={i} className="w-7 h-7 border-2 border-card">
                      <AvatarImage src={a} />
                      <AvatarFallback>·</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-[14px] text-muted-foreground font-medium">Ami(e)s avec des points communs</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 grid grid-cols-2 gap-2 w-full">
              {isOwnProfile ? (
                <>
                  <Button className="h-10 rounded-lg gap-2 font-semibold text-[15px]">
                    <Plus className="w-4 h-4" strokeWidth={3} /> Ajouter à la story
                  </Button>
                  <Button variant="secondary" className="h-10 rounded-lg gap-2 font-semibold text-[15px]" onClick={() => navigate("/settings")}>
                    <Edit3 className="w-4 h-4" /> Modifier le profil
                  </Button>
                </>
              ) : (
                <>
                  {renderFriendButton()}
                  <Button variant="secondary" className="h-10 rounded-lg gap-2 font-semibold text-[15px]" onClick={() => navigate("/messages")}>
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                </>
              )}
            </div>

            {/* Bio (optional, kept editable) */}
            {(profile?.bio || isOwnProfile) && (
              <div className="mt-3 w-full text-center">
                {isEditingBio ? (
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={2}
                      maxLength={150}
                    />
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={saveBio}>OK</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setEditBio(profile?.bio || ""); }}>✕</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {profile?.bio || (isOwnProfile ? "Ajoutez une bio..." : "")}
                    {isOwnProfile && (
                      <button onClick={() => setIsEditingBio(true)} className="ml-1 text-primary inline-flex items-center">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========== DESKTOP (existing layout) ========== */}
      <div className="hidden lg:block shadow-sm">
        <div className="relative max-w-[940px] mx-auto">
          <div
            className="relative h-[350px] rounded-b-xl overflow-hidden group"
            onMouseEnter={() => setCoverHover(true)}
            onMouseLeave={() => setCoverHover(false)}
          >
            <img
              src={coverUrl}
              alt="Couverture"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {isOwnProfile && coverHover && (
              <button className="absolute bottom-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-card transition-all shadow-lg animate-fade-in">
                <Camera className="w-4 h-4" /> Modifier la couverture
              </button>
            )}
          </div>

          <div className="absolute -bottom-16 left-8">
            <div className="relative group">
              <Avatar className="w-[168px] h-[168px] border-4 border-card shadow-xl transition-transform duration-300 group-hover:scale-105">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className="text-4xl bg-muted">{displayName[0]}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 w-9 h-9 bg-muted rounded-full flex items-center justify-center shadow-md hover:bg-muted/80 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 duration-300">
                  <Camera className="w-4 h-4 text-foreground" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-[940px] mx-auto px-4 pt-6 pb-4">
          <div className="flex items-end justify-between gap-4 ml-[190px]">
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground">{displayName}</h1>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">
                {friendsCount} ami{friendsCount !== 1 ? "s" : ""} · {postsCount} publications
              </p>

              {isEditingBio ? (
                <div className="mt-2 flex gap-2 items-start animate-fade-in">
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    rows={2}
                    maxLength={150}
                  />
                  <div className="flex flex-col gap-1">
                    <Button size="sm" onClick={saveBio}>OK</Button>
                    <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setEditBio(profile?.bio || ""); }}>✕</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  {profile?.bio || (isOwnProfile ? "Ajoutez une bio..." : "")}
                  {isOwnProfile && (
                    <button onClick={() => setIsEditingBio(true)} className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5">
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </p>
              )}
            </div>

            <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
              {isOwnProfile ? (
                <>
                  <Button className="rounded-lg gap-2">
                    <Plus className="w-4 h-4" strokeWidth={3} /> Ajouter à la story
                  </Button>
                  <Button variant="secondary" className="rounded-lg gap-2" onClick={() => navigate("/settings")}>
                    <Edit3 className="w-4 h-4" /> Modifier le profil
                  </Button>
                </>
              ) : (
                <>
                  {renderFriendButton()}
                  <Button variant="secondary" className="rounded-lg gap-2" onClick={() => navigate("/messages")}>
                    <MessageCircle className="w-4 h-4" /> Message
                  </Button>
                  <Button
                    variant={isFollowing ? "outline" : "secondary"}
                    onClick={handleFollow}
                    className="rounded-lg gap-2 transition-all duration-300"
                  >
                    {isFollowing ? "Abonné ✓" : "Suivre"}
                  </Button>
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-lg">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isOwnProfile ? (
                    <>
                      <DropdownMenuItem onClick={() => navigate("/settings")}>Paramètres du profil</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Journal d'activité")}>Journal d'activité</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Archiver le profil")}>Archiver</DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem onClick={() => toast.info("Utilisateur bloqué")}>Bloquer</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Utilisateur signalé")}>Signaler le profil</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.info("Lien copié !")}>Copier le lien du profil</DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
