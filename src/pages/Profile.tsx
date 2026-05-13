import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import RightSidebar from "@/components/dashboard/RightSidebar";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", firstName: "U", avatar: "https://i.pravatar.cc/150?img=3" });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, avatar_url")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile) {
          const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur";
          setUserInfo({
            name,
            firstName: profile.first_name || "U",
            avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`,
          });
        }
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
      <DashboardNavbar user={userInfo} />
      <div className="pt-14">
        <ProfileHeader
          profileUserId={profileUserId!}
          currentUserId={currentUserId}
          isOwnProfile={profileUserId === currentUserId}
        />
        <div className="max-w-[1100px] mx-auto px-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            <ProfileTabs
              profileUserId={profileUserId!}
              currentUserId={currentUserId}
            />
            {/* Right Sidebar - desktop only */}
            <aside className="hidden lg:block sticky top-20 self-start">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
      <MobileBottomNav />

    </div>
  );
};

export default Profile;
