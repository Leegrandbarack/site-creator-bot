import { useState } from "react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import LeftSidebar from "@/components/dashboard/LeftSidebar";
import NewsFeed from "@/components/dashboard/NewsFeed";
import RightSidebar from "@/components/dashboard/RightSidebar";

const Dashboard = () => {
  const [user] = useState({
    name: "Utilisateur Demo",
    firstName: "Utilisateur",
    avatar: "https://i.pravatar.cc/150?img=3",
  });

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar user={user} />
      <div className="pt-14 flex max-w-[1920px] mx-auto">
        {/* Left Sidebar - hidden on mobile */}
        <aside className="hidden lg:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <LeftSidebar user={user} />
        </aside>

        {/* Center - News Feed */}
        <main className="flex-1 min-w-0 max-w-[680px] mx-auto px-3 py-4">
          <NewsFeed user={user} />
        </main>

        {/* Right Sidebar - hidden on mobile/tablet */}
        <aside className="hidden xl:block w-[280px] shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-3">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
};

export default Dashboard;
