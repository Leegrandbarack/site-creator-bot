import { useState } from "react";
import { UserPlus, MessageCircle, UserCheck, Camera, Edit3, UserX, Clock, Check, X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFriendship } from "@/hooks/useFriendship";

interface ProfileHeaderProps {
  profileUserId: string;
  currentUserId: string;
  isOwnProfile: boolean;
}

const ProfileHeader = ({ profileUserId, currentUserId, isOwnProfile }: ProfileHeaderProps) => {
  const {
    status, isLoading, friendsCount,
    sendRequest, acceptRequest, rejectRequest, removeFriend,
  } = useFriendship(currentUserId, profileUserId);

  const [isFollowing, setIsFollowing] = useState(false);
  const [bio, setBio] = useState("Passionné de technologie et de création 🚀 | Développeur | Amoureux de la vie");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editBio, setEditBio] = useState(bio);

  const profileName = "Utilisateur Demo";
  const avatarUrl = `https://i.pravatar.cc/150?u=${profileUserId}`;
  const coverUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=940&h=350&fit=crop";

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    toast.success(isFollowing ? "Vous ne suivez plus cet utilisateur" : "Vous suivez cet utilisateur !");
  };

  const saveBio = () => {
    setBio(editBio);
    setIsEditingBio(false);
    toast.success("Bio mise à jour !");
  };

  const handleFriendAction = async () => {
    if (status === "none") {
      await sendRequest();
      toast.success("Demande d'ami envoyée !");
    } else if (status === "accepted") {
      await removeFriend();
      toast.success("Ami retiré");
    } else if (status === "pending_sent") {
      await rejectRequest(); // cancel
      toast.success("Demande annulée");
    }
  };

  const renderFriendButton = () => {
    if (isOwnProfile) return null;

    switch (status) {
      case "none":
        return (
          <Button onClick={handleFriendAction} disabled={isLoading} className="rounded-lg gap-2 transition-all duration-300">
            <UserPlus className="w-4 h-4" /> Ajouter
          </Button>
        );
      case "pending_sent":
        return (
          <Button onClick={handleFriendAction} disabled={isLoading} variant="outline" className="rounded-lg gap-2 transition-all duration-300">
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
          <Button onClick={handleFriendAction} disabled={isLoading} variant="secondary" className="rounded-lg gap-2 transition-all duration-300">
            <UserCheck className="w-4 h-4" /> Ami(e)
          </Button>
        );
    }
  };

  return (
    <div className="bg-card shadow-sm">
      {/* Cover Photo */}
      <div className="relative max-w-[940px] mx-auto">
        <div className="relative h-[200px] sm:h-[280px] md:h-[350px] rounded-b-xl overflow-hidden group">
          <img src={coverUrl} alt="Couverture" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {isOwnProfile && (
            <button className="absolute bottom-4 right-4 flex items-center gap-2 bg-card/90 backdrop-blur-sm text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-card transition-colors shadow-lg opacity-0 group-hover:opacity-100 duration-300">
              <Camera className="w-4 h-4" /> Modifier la couverture
            </button>
          )}
        </div>

        {/* Profile Avatar */}
        <div className="absolute -bottom-16 left-4 sm:left-8">
          <div className="relative group">
            <Avatar className="w-32 h-32 sm:w-[168px] sm:h-[168px] border-4 border-card shadow-xl transition-transform duration-300 group-hover:scale-105">
              <AvatarImage src={avatarUrl} alt={profileName} />
              <AvatarFallback className="text-4xl">{profileName[0]}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <button className="absolute bottom-2 right-2 w-9 h-9 bg-muted rounded-full flex items-center justify-center shadow-md hover:bg-muted/80 transition-colors opacity-0 group-hover:opacity-100 duration-300">
                <Camera className="w-4 h-4 text-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="max-w-[940px] mx-auto px-4 pt-20 sm:pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:ml-[190px]">
          <div className="animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{profileName}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {friendsCount} ami{friendsCount !== 1 ? "s" : ""} · 1.2k abonnés
            </p>

            {isEditingBio ? (
              <div className="mt-2 flex gap-2 items-start animate-fade-in">
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  rows={2}
                  maxLength={150}
                />
                <div className="flex flex-col gap-1">
                  <Button size="sm" onClick={saveBio}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setIsEditingBio(false); setEditBio(bio); }}>✕</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                {bio}
                {isOwnProfile && (
                  <button onClick={() => setIsEditingBio(true)} className="ml-2 text-primary hover:underline inline-flex items-center gap-0.5">
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
            {isOwnProfile ? (
              <Button variant="secondary" className="rounded-lg gap-2">
                <Edit3 className="w-4 h-4" /> Modifier le profil
              </Button>
            ) : (
              <>
                {renderFriendButton()}
                <Button variant="secondary" className="rounded-lg gap-2">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
