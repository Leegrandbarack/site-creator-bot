import { useState, useEffect } from "react";
import { Users, UsersRound, Bookmark, Calendar, ShoppingBag, Tv, Heart, Flag, Gamepad2, ChevronDown, MessageCircle, Newspaper, Clock, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LeftSidebarProps {
  user: { name: string; firstName: string; avatar: string };
}

const menuItems = [
  { icon: Newspaper, label: "Fil d'actualité", color: "text-primary", path: "/dashboard" },
  { icon: MessageCircle, label: "Discussions", color: "text-primary", path: "/messages" },
  { icon: Users, label: "Utilisateurs", color: "text-primary", path: "/users" },
  { icon: UsersRound, label: "Groupes", color: "text-primary", path: "/dashboard" },
  { icon: Flag, label: "Pages", color: "text-orange-500", path: "/dashboard" },
  { icon: ShoppingBag, label: "Marketplace", color: "text-primary", path: "/dashboard" },
  { icon: Tv, label: "Vidéos", color: "text-primary", path: "/dashboard" },
  { icon: Heart, label: "Favoris", color: "text-destructive", path: "/dashboard" },
  { icon: Bookmark, label: "Enregistrements", color: "text-violet-500", path: "/dashboard" },
  { icon: Calendar, label: "Événements", color: "text-destructive", path: "/dashboard" },
  { icon: Gamepad2, label: "Jeux", color: "text-primary", path: "/dashboard" },
  { icon: Clock, label: "Souvenirs", color: "text-primary", path: "/dashboard" },
  { icon: Settings, label: "Paramètres", color: "text-muted-foreground", path: "/settings" },
];

const shortcuts: { name: string; avatar: string; path: string }[] = [];

const LeftSidebar = ({ user }: LeftSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [profileData, setProfileData] = useState<{ name: string; avatar: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (data) {
        setProfileData({
          name: [data.first_name, data.last_name].filter(Boolean).join(" ") || user.name,
          avatar: data.avatar_url || user.avatar,
        });
      }
    };
    fetchProfile();
  }, [user]);

  const displayName = profileData?.name || user.name;
  const displayAvatar = profileData?.avatar || user.avatar;
  const visibleItems = showMore ? menuItems : menuItems.slice(0, 8);

  return (
    <div className="space-y-1">
      {/* User Profile Link */}
      <button
        onClick={() => navigate("/profile")}
        className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group ${
          location.pathname === "/profile" ? "bg-primary/10" : "hover:bg-card"
        }`}
      >
        <Avatar className="w-9 h-9 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
          <AvatarImage src={displayAvatar} alt={displayName} />
          <AvatarFallback className="bg-muted text-sm">{displayName[0]}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
          {displayName}
        </span>
      </button>

      {/* Menu Items */}
      {visibleItems.map((item, i) => {
        const isActive = location.pathname === item.path && item.path !== "/dashboard";
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 group animate-fade-in ${
              isActive ? "bg-primary/10" : "hover:bg-card"
            }`}
            style={{ animationDelay: `${i * 25}ms` }}
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
              isActive ? "bg-primary/10" : "bg-muted"
            }`}>
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : item.color}`} />
            </div>
            <span className={`text-sm font-medium truncate ${isActive ? "text-primary font-semibold" : "text-foreground"}`}>
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Show more/less */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-card transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ChevronDown className={`w-5 h-5 text-foreground transition-transform duration-300 ${showMore ? "rotate-180" : ""}`} />
        </div>
        <span className="text-sm font-medium text-foreground">{showMore ? "Voir moins" : "Voir plus"}</span>
      </button>

      {/* Separator */}
      <div className="border-t border-border mx-2 my-2" />

      {/* Shortcuts */}
      <div className="px-2 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vos raccourcis</h3>
      </div>
      {shortcuts.map((s, i) => (
        <button
          key={s.name}
          onClick={() => navigate(s.path)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <img
            src={s.avatar}
            alt={s.name}
            className="w-9 h-9 rounded-lg object-cover group-hover:scale-105 transition-transform"
          />
          <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
        </button>
      ))}

      {/* Footer */}
      <div className="pt-4 px-2">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Confidentialité · Conditions · Publicités · Cookies · Meta © 2026
        </p>
      </div>
    </div>
  );
};

export default LeftSidebar;
