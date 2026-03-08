import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { X, Search, Loader2, MessageCircle } from "lucide-react";

interface NewConversationDialogProps {
  userId: string;
  onSelect: (otherUserId: string) => void;
  onClose: () => void;
}

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}

const NewConversationDialog = ({ userId, onSelect, onClose }: NewConversationDialogProps) => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .neq("user_id", userId)
        .limit(50);
      setUsers(data || []);
      setLoading(false);
    };

    const fetchPresence = async () => {
      const { data } = await supabase.from("user_presence").select("user_id").eq("is_online", true);
      setOnlineUsers(new Set((data || []).map((p) => p.user_id)));
    };

    fetchUsers();
    fetchPresence();
  }, [userId]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const name = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 max-h-[70vh] flex flex-col animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-lg text-foreground">Nouvelle conversation</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Rechercher un utilisateur..."
              className="pl-9 h-10 rounded-full bg-muted border-0 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search ? "Aucun utilisateur trouvé" : "Aucun utilisateur disponible"}
              </p>
            </div>
          ) : (
            filtered.map((user, i) => {
              const name = `${user.first_name || "Utilisateur"} ${user.last_name || ""}`.trim();
              const avatarUrl = user.avatar_url || undefined;
              const isOnline = onlineUsers.has(user.user_id);

              return (
                <button
                  key={user.user_id}
                  onClick={() => onSelect(user.user_id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/70 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{name[0]}</AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm text-foreground truncate">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isOnline ? "En ligne" : "Hors ligne"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default NewConversationDialog;
