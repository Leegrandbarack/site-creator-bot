import { useState, useEffect } from "react";
import { UserPlus, Search, ChevronDown, Calendar, Flag, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const suggestions = [
  { name: "Léa Martin", avatar: "https://i.pravatar.cc/150?img=20", mutual: 5 },
  { name: "Karim N.", avatar: "https://i.pravatar.cc/150?img=33", mutual: 3 },
  { name: "Julie P.", avatar: "https://i.pravatar.cc/150?img=23", mutual: 8 },
  { name: "Thomas R.", avatar: "https://i.pravatar.cc/150?img=14", mutual: 2 },
];

const events = [
  { title: "Meetup Développeurs", date: "12 mars 2026", icon: Calendar },
  { title: "Concert Live", date: "18 mars 2026", icon: Calendar },
];

const pages = [
  { name: "Tech Daily", avatar: "https://i.pravatar.cc/80?img=50", followers: "12k" },
  { name: "Design Hub", avatar: "https://i.pravatar.cc/80?img=51", followers: "8.5k" },
];

const RightSidebar = () => {
  const [contactSearch, setContactSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ name: string; avatar: string; user_id: string }[]>([]);
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchOnline = async () => {
      const { data } = await supabase
        .from("user_presence")
        .select("user_id, is_online")
        .eq("is_online", true)
        .limit(20);
      if (data && data.length > 0) {
        const ids = data.map((d) => d.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", ids);
        if (profiles) {
          setOnlineUsers(
            profiles.map((p) => ({
              user_id: p.user_id,
              name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur",
              avatar: p.avatar_url || `https://i.pravatar.cc/150?u=${p.user_id}`,
            }))
          );
        }
      }
    };
    fetchOnline();
  }, []);

  // Fallback contacts when no real online users
  const fallbackContacts = [
    { name: "Amina K.", avatar: "https://i.pravatar.cc/150?img=1", user_id: "1" },
    { name: "Paul D.", avatar: "https://i.pravatar.cc/150?img=4", user_id: "2" },
    { name: "Claire M.", avatar: "https://i.pravatar.cc/150?img=10", user_id: "3" },
    { name: "Omar B.", avatar: "https://i.pravatar.cc/150?img=11", user_id: "4" },
    { name: "Fatou S.", avatar: "https://i.pravatar.cc/150?img=16", user_id: "5" },
    { name: "Thomas R.", avatar: "https://i.pravatar.cc/150?img=14", user_id: "6" },
    { name: "Julie P.", avatar: "https://i.pravatar.cc/150?img=23", user_id: "7" },
    { name: "Karim N.", avatar: "https://i.pravatar.cc/150?img=33", user_id: "8" },
  ];

  const contacts = onlineUsers.length > 0 ? onlineUsers : fallbackContacts;
  const filteredContacts = contacts.filter((u) =>
    u.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, 3);

  const handleAddFriend = (name: string) => {
    setAddedFriends((prev) => new Set(prev).add(name));
  };

  return (
    <div className="space-y-5">
      {/* Sponsored / Ad */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Sponsorisé</h3>
        <div className="bg-card rounded-xl border border-border p-3 hover:shadow-md transition-shadow duration-200 cursor-pointer group">
          <div className="flex gap-3">
            <img
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=120&h=120&fit=crop"
              alt="Ad"
              className="w-[100px] h-[100px] rounded-lg object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Apprenez le code</p>
              <p className="text-xs text-muted-foreground mt-0.5">codecademy.com</p>
              <p className="text-xs text-muted-foreground mt-1">Cours gratuits pour débuter en programmation web.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Friend Suggestions */}
      <div>
        <div className="flex items-center justify-between px-2 mb-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Suggestions d'amis</h3>
        </div>
        <div className="space-y-1">
          {visibleSuggestions.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Avatar className="w-10 h-10 group-hover:ring-2 group-hover:ring-primary/10 transition-all">
                <AvatarImage src={s.avatar} alt={s.name} />
                <AvatarFallback className="bg-muted text-sm">{s.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{s.mutual} amis en commun</p>
              </div>
              {addedFriends.has(s.name) ? (
                <span className="text-xs text-muted-foreground font-medium">Envoyé ✓</span>
              ) : (
                <Button size="sm" className="h-8 px-3 text-xs font-semibold" onClick={() => handleAddFriend(s.name)}>
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Ajouter
                </Button>
              )}
            </div>
          ))}
        </div>
        {suggestions.length > 3 && (
          <button
            onClick={() => setShowAllSuggestions(!showAllSuggestions)}
            className="w-full flex items-center justify-center gap-1 py-2 text-xs text-primary hover:underline transition-colors mt-1"
          >
            {showAllSuggestions ? "Voir moins" : "Voir plus"}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${showAllSuggestions ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div className="border-t border-border" />

      {/* Events */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Événements à venir</h3>
        <div className="space-y-1.5">
          {events.map((event, i) => (
            <div
              key={event.title}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-all duration-200 group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <event.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Pages */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Pages suivies</h3>
        <div className="space-y-1.5">
          {pages.map((page, i) => (
            <div
              key={page.name}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <img
                src={page.avatar}
                alt={page.name}
                className="w-9 h-9 rounded-lg object-cover group-hover:scale-105 transition-transform"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{page.name}</p>
                <p className="text-xs text-muted-foreground">{page.followers} abonnés</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Online Contacts */}
      <div>
        <div className="flex items-center justify-between px-2 mb-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacts</h3>
          <Search
            className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
            onClick={() => {
              setShowSearchInput(!showSearchInput);
              if (showSearchInput) setContactSearch("");
            }}
          />
        </div>
        {showSearchInput && (
          <div className="px-2 mb-2 animate-fade-in">
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Rechercher un contact..."
              className="h-8 rounded-full bg-muted border-0 text-xs"
              autoFocus
            />
          </div>
        )}
        <div className="space-y-0.5">
          {filteredContacts.map((u, i) => (
            <button
              key={u.user_id}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
              style={{ animationDelay: `${i * 25}ms` }}
            >
              <div className="relative">
                <Avatar className="w-8 h-8 group-hover:ring-2 group-hover:ring-primary/10 transition-all">
                  <AvatarImage src={u.avatar} alt={u.name} />
                  <AvatarFallback className="bg-muted text-xs">{u.name[0]}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-muted" />
              </div>
              <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">{u.name}</span>
            </button>
          ))}
          {filteredContacts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">Aucun contact trouvé</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
