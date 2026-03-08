import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import NewsFeed from "@/components/dashboard/NewsFeed";
import RightSidebar from "@/components/dashboard/RightSidebar";

const Dashboard = () => {
  const [isReady, setIsReady] = useState(false);
  const [user] = useState({
    name: "Utilisateur Demo",
    firstName: "Utilisateur",
    avatar: "https://i.pravatar.cc/150?img=3",
  });

  useEffect(() => {
    const ensureSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Auto sign-in anonymously
        await supabase.auth.signInAnonymously();
      }
      setIsReady(true);
    };
    ensureSession();
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar user={user} />
      <div className="pt-14 flex max-w-[1920px] mx-auto">
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <LeftSidebar user={user} />
        </aside>
        <main className="flex-1 min-w-0 max-w-[680px] mx-auto px-3 py-4">
          <NewsFeed user={user} />
        </main>
        <aside className="hidden xl:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
