import { Users, UsersRound, Bookmark, Calendar, ShoppingBag, Tv, Heart, Flag, Gamepad2, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface LeftSidebarProps {
  user: { name: string; firstName: string; avatar: string };
}

const menuItems = [
  { icon: Users, label: "Amis", color: "text-primary" },
  { icon: UsersRound, label: "Groupes", color: "text-primary" },
  { icon: Flag, label: "Pages", color: "text-orange-500" },
  { icon: ShoppingBag, label: "Marketplace", color: "text-primary" },
  { icon: Tv, label: "Vidéos", color: "text-primary" },
  { icon: Heart, label: "Favoris", color: "text-destructive" },
  { icon: Bookmark, label: "Enregistrements", color: "text-violet-500" },
  { icon: Calendar, label: "Événements", color: "text-destructive" },
  { icon: Gamepad2, label: "Jeux", color: "text-primary" },
];

const LeftSidebar = ({ user }: LeftSidebarProps) => {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  const visibleItems = showMore ? menuItems : menuItems.slice(0, 6);

  return (
    <div className="space-y-0.5">
      {/* User Profile Link */}
      <button onClick={() => navigate("/profile")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-all duration-200 group">
        <Avatar className="w-9 h-9 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.firstName[0]}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{user.name}</span>
      </button>

      {/* Menu Items */}
      {visibleItems.map((item, i) => (
        <button
          key={item.label}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
          style={{ animationDelay: `${i * 30}ms` }}
        >
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <span className="text-sm font-medium text-foreground">{item.label}</span>
        </button>
      ))}

      {/* Show more/less */}
      <button
        onClick={() => setShowMore(!showMore)}
        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          <ChevronDown className={`w-5 h-5 text-foreground transition-transform duration-200 ${showMore ? "rotate-180" : ""}`} />
        </div>
        <span className="text-sm font-medium text-foreground">{showMore ? "Voir moins" : "Voir plus"}</span>
      </button>

      {/* Footer */}
      <div className="pt-4 px-2">
        <p className="text-xs text-muted-foreground">
          Confidentialité · Conditions · Publicités · Cookies · Meta © 2026
        </p>
      </div>
    </div>
  );
};

export default LeftSidebar;
