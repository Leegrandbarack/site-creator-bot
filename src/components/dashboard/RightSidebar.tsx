import { UserPlus, TrendingUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const onlineUsers = [
  { name: "Amina K.", avatar: "https://i.pravatar.cc/150?img=1" },
  { name: "Paul D.", avatar: "https://i.pravatar.cc/150?img=4" },
  { name: "Claire M.", avatar: "https://i.pravatar.cc/150?img=10" },
  { name: "Omar B.", avatar: "https://i.pravatar.cc/150?img=11" },
  { name: "Fatou S.", avatar: "https://i.pravatar.cc/150?img=16" },
  { name: "Thomas R.", avatar: "https://i.pravatar.cc/150?img=14" },
];

const suggestions = [
  { name: "Léa Martin", avatar: "https://i.pravatar.cc/150?img=20", mutual: 5 },
  { name: "Karim N.", avatar: "https://i.pravatar.cc/150?img=33", mutual: 3 },
  { name: "Julie P.", avatar: "https://i.pravatar.cc/150?img=23", mutual: 8 },
];

const trends = [
  { tag: "#TechAfrica", posts: "12.4k" },
  { tag: "#Musique2026", posts: "8.2k" },
  { tag: "#Football", posts: "45.1k" },
  { tag: "#Entrepreneuriat", posts: "6.7k" },
];

const RightSidebar = () => {
  return (
    <div className="space-y-5">
      {/* Friend Suggestions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Suggestions d'amis</h3>
        <div className="space-y-1">
          {suggestions.map((s) => (
            <div key={s.name} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-colors group">
              <Avatar className="w-9 h-9">
                <AvatarImage src={s.avatar} alt={s.name} />
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.mutual} amis en commun</p>
              </div>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <UserPlus className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Online Users */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Contacts en ligne</h3>
        <div className="space-y-0.5">
          {onlineUsers.map((u) => (
            <button key={u.name} className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-colors">
              <div className="relative">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full border-2 border-muted" />
              </div>
              <span className="text-sm text-foreground">{u.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trends */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" /> Tendances
        </h3>
        <div className="space-y-0.5">
          {trends.map((t) => (
            <button key={t.tag} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-card transition-colors">
              <span className="text-sm font-semibold text-primary">{t.tag}</span>
              <span className="text-xs text-muted-foreground">{t.posts} posts</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
