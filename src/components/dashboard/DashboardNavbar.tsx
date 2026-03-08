import { useState, useEffect } from "react";
import { Search, Bell, MessageCircle, ChevronDown, Settings, LogOut, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import NotificationsDropdown from "./NotificationsDropdown";

interface DashboardNavbarProps {
  user: { name: string; firstName: string; avatar: string };
}

const DashboardNavbar = ({ user }: DashboardNavbarProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-card shadow-sm border-b border-border flex items-center px-4 gap-2">
      {/* Logo + Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <svg viewBox="0 0 36 36" className="w-10 h-10 fill-primary shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate("/dashboard")}>
          <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z" />
          <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z" />
        </svg>
        <div className={`relative transition-all duration-200 ${searchFocused ? "w-72" : "w-60"}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher sur Facebook"
            className="pl-9 h-9 rounded-full bg-muted border-0 text-sm focus-visible:ring-1"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      {/* Right Icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate("/messages")}
          className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors group"
        >
          <MessageCircle className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
        </button>
        {userId && <NotificationsDropdown userId={userId} />}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-1 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <Avatar className="w-9 h-9">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.firstName[0]}</AvatarFallback>
            </Avatar>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-card rounded-xl shadow-xl border border-border z-50 animate-scale-in overflow-hidden">
                <div className="p-3 border-b border-border">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.firstName[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-foreground">{user.name}</span>
                  </div>
                </div>
                <div className="p-2">
                  <button onClick={() => { setMenuOpen(false); navigate("/profile"); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><User className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-foreground">Mon profil</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><Settings className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-foreground">Paramètres</span>
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
                    <span className="text-sm font-medium text-foreground">Déconnexion</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default DashboardNavbar;
