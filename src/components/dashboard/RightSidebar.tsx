import { useState, useEffect } from "react";
import { Search, ChevronDown, Calendar, ExternalLink } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const events = [
  { title: "Meetup Développeurs", date: "12 mars 2026", icon: Calendar },
  { title: "Concert Live", date: "18 mars 2026", icon: Calendar },
];

const RightSidebar = () => {
  const [contactSearch, setContactSearch] = useState("");
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ name: string; avatar: string; user_id: string }[]>([]);
  const [allUsers, setAllUsers] = useState<{ name: string; avatar: string; user_id: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch all profiles except current user
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .neq("user_id", session.user.id)
        .not("first_name", "is", null)
        .neq("first_name", "")
        .limit(20);

      // Fetch online status
      const { data: presence } = await supabase
        .from("user_presence")
        .select("user_id")
        .eq("is_online", true);

      const onlineSet = new Set((presence || []).map((p) => p.user_id));

      const mapped = (profiles || []).map((p) => ({
        user_id: p.user_id,
        name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur",
        avatar: p.avatar_url || "",
      }));

      setAllUsers(mapped);
      setOnlineUsers(mapped.filter((u) => onlineSet.has(u.user_id)));
    };
    fetchUsers();
  }, []);

  const contacts = onlineUsers.length > 0 ? onlineUsers : allUsers;
  const filteredContacts = contacts.filter((u) =>
    u.name.toLowerCase().includes(contactSearch.toLowerCase())
  );

  const handleContactClick = async (targetUserId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", session.user.id);

    const { data: theirConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetUserId);

    const myIds = new Set(myConvs?.map(c => c.conversation_id) || []);
    const sharedId = theirConvs?.find(c => myIds.has(c.conversation_id))?.conversation_id;

    if (sharedId) {
      navigate(`/messages?conversation=${sharedId}`);
      return;
    }

    const { data: conv } = await supabase.from("conversations").insert({}).select().single();
    if (conv) {
      await supabase.from("conversation_participants").insert([
        { conversation_id: conv.id, user_id: session.user.id },
        { conversation_id: conv.id, user_id: targetUserId },
      ]);
      navigate(`/messages?conversation=${conv.id}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Sponsored */}
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

      {/* Online Contacts - Real users only */}
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
          {filteredContacts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {allUsers.length === 0 ? "Aucun utilisateur inscrit" : "Aucun contact en ligne"}
            </p>
          ) : (
            filteredContacts.map((u, i) => (
              <button
                key={u.user_id}
                onClick={() => handleContactClick(u.user_id)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-card transition-all duration-200 group animate-fade-in"
                style={{ animationDelay: `${i * 25}ms` }}
              >
                <div className="relative">
                  <Avatar className="w-8 h-8 group-hover:ring-2 group-hover:ring-primary/10 transition-all">
                    <AvatarImage src={u.avatar || undefined} alt={u.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{u.name[0]}</AvatarFallback>
                  </Avatar>
                  {onlineUsers.some(ou => ou.user_id === u.user_id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-muted" />
                  )}
                </div>
                <span className="text-sm text-foreground group-hover:text-primary transition-colors truncate">{u.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
