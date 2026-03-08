import { Users, Image, UsersRound, Bookmark, Calendar, ShoppingBag } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

interface LeftSidebarProps {
  user: { name: string; firstName: string; avatar: string };
}

const shortcuts = [
  { icon: Users, label: "Amis", count: 128 },
  { icon: UsersRound, label: "Groupes", count: 12 },
  { icon: Image, label: "Photos", count: null },
  { icon: Bookmark, label: "Enregistrements", count: null },
  { icon: Calendar, label: "Événements", count: 3 },
  { icon: ShoppingBag, label: "Marketplace", count: null },
];

const LeftSidebar = ({ user }: LeftSidebarProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-1">
      {/* User Profile Link */}
      <button onClick={() => navigate("/profile")} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors group">
        <Avatar className="w-9 h-9 group-hover:ring-2 group-hover:ring-primary/20 transition-all">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.firstName[0]}</AvatarFallback>
        </Avatar>
        <span className="font-semibold text-sm text-foreground">{user.name}</span>
      </button>

      {/* Shortcuts */}
      {shortcuts.map((item) => (
        <button
          key={item.label}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <item.icon className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-foreground">{item.label}</span>
          {item.count && (
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
};

export default LeftSidebar;
