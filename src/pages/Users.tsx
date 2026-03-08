import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search, Loader2 } from "lucide-react";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_online?: boolean;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, first_name, last_name, avatar_url, bio")
        .neq("user_id", session.user.id);

      const { data: presence } = await supabase
        .from("user_presence")
        .select("user_id, is_online");

      const presenceMap = new Map(presence?.map(p => [p.user_id, p.is_online]) || []);

      setUsers(
        (profiles || []).map(p => ({
          ...p,
          is_online: presenceMap.get(p.user_id) || false,
        }))
      );
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleMessage = async (targetUserId: string) => {
    if (!currentUserId) return;
    setNavigatingTo(targetUserId);

    // Check if conversation already exists
    const { data: myConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    const { data: theirConversations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", targetUserId);

    const myIds = new Set(myConversations?.map(c => c.conversation_id) || []);
    const sharedConvId = theirConversations?.find(c => myIds.has(c.conversation_id))?.conversation_id;

    if (sharedConvId) {
      navigate(`/messages?conversation=${sharedConvId}`);
      return;
    }

    // Create new conversation using RPC
    const { data: convId } = await supabase
      .rpc("create_conversation_with_participant", { other_user_id: targetUserId });

    if (convId) {
      navigate(`/messages?conversation=${convId}`);
    }
    setNavigatingTo(null);
  };

  const filtered = users.filter(u => {
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const user = { name: "Moi", firstName: "Moi", avatar: "" };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar user={user} />
      <div className="pt-14 max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-4">Utilisateurs</h1>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher des utilisateurs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 bg-card border-border"
          />
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">Aucun utilisateur trouvé</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((u) => {
              const name = `${u.first_name || ""} ${u.last_name || ""}`.trim() || "Utilisateur";
              const isNavigating = navigatingTo === u.user_id;

              return (
                <div
                  key={u.id}
                  onClick={() => handleMessage(u.user_id)}
                  className="bg-card rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all border border-border cursor-pointer hover:bg-accent/50 active:scale-[0.99]"
                >
                  <div className="relative">
                    <Avatar className="w-14 h-14">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {(u.first_name?.[0] || "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {u.is_online && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{name}</p>
                    {u.bio && (
                      <p className="text-sm text-muted-foreground truncate">{u.bio}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {u.is_online ? "🟢 En ligne" : "⚫ Hors ligne"}
                    </p>
                  </div>

                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                    {isNavigating ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
