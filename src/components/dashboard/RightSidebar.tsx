import { UserPlus, TrendingUp, Search } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const onlineUsers = [
  { name: "Amina K.", avatar: "https://i.pravatar.cc/150?img=1" },
  { name: "Paul D.", avatar: "https://i.pravatar.cc/150?img=4" },
  { name: "Claire M.", avatar: "https://i.pravatar.cc/150?img=10" },
  { name: "Omar B.", avatar: "https://i.pravatar.cc/150?img=11" },
  { name: "Fatou S.", avatar: "https://i.pravatar.cc/150?img=16" },
  { name: "Thomas R.", avatar: "https://i.pravatar.cc/150?img=14" },
  { name: "Julie P.", avatar: "https://i.pravatar.cc/150?img=23" },
  { name: "Karim N.", avatar: "https://i.pravatar.cc/150?img=33" },
];

const suggestions = [
  { name: "Léa Martin", avatar: "https://i.pravatar.cc/150?img=20", mutual: 5 },
  { name: "Karim N.", avatar: "https://i.pravatar.cc/150?img=33", mutual: 3 },
  { name: "Julie P.", avatar: "https://i.pravatar.cc/150?img=23", mutual: 8 },
];

const RightSidebar = () => {
  const [contactSearch, setContactSearch] = useState("");

  const filteredContacts = onlineUsers.filter((u) =>
    u.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Friend Suggestions */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Suggestions d'amis</h3>
        <div className="space-y-1">
          {suggestions.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Avatar className="w-10 h-10">
                <AvatarImage src={s.avatar} alt={s.name} />
                <AvatarFallback>{s.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.mutual} amis en commun</p>
              </div>
              <Button size="sm" className="h-8 px-3 text-xs font-semibold">
                <UserPlus className="w-3.5 h-3.5 mr-1" /> Ajouter
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="border-t border-border" />

      {/* Online Contacts */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-sm font-semibold text-muted-foreground">Contacts</h3>
          <Search className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" onClick={() => setContactSearch(contactSearch ? "" : " ")} />
        </div>
        {contactSearch !== "" && (
          <div className="px-2 mb-2">
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Rechercher..."
              className="h-8 rounded-full bg-muted border-0 text-xs"
              autoFocus
            />
          </div>
        )}
        <div className="space-y-0.5">
          {filteredContacts.map((u, i) => (
            <button
              key={u.name}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="relative">
                <Avatar className="w-8 h-8 group-hover:ring-2 group-hover:ring-primary/10 transition-all">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-muted" />
              </div>
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{u.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
