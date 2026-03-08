import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const user = {
    name: "Utilisateur Demo",
    firstName: "Utilisateur",
    avatar: "https://i.pravatar.cc/150?img=3",
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInAnonymously();
        const { data: { session: newSession } } = await supabase.auth.getSession();
        setCurrentUserId(newSession?.user?.id || null);
      } else {
        setCurrentUserId(session.user.id);
      }
      setIsReady(true);
    };
    init();
  }, []);

  const profileUserId = paramUserId || currentUserId;

  if (!isReady || !currentUserId) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar user={user} />
      <div className="pt-14">
        <ProfileHeader
          profileUserId={profileUserId!}
          currentUserId={currentUserId}
          isOwnProfile={profileUserId === currentUserId}
        />
        <div className="max-w-[940px] mx-auto px-4">
          <ProfileTabs
            profileUserId={profileUserId!}
            currentUserId={currentUserId}
          />
        </div>
      </div>
    </div>
  );
};

export default Profile;
