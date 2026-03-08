import { Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Edit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onlineUsers: Set<string>;
}

const ConversationList = ({ conversations, activeId, onSelect, onlineUsers }: ConversationListProps) => {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = `${c.participant?.first_name || ""} ${c.participant?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-foreground">Discussions</h2>
          <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <Edit className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans Messenger"
            className="pl-9 h-9 rounded-full bg-muted border-0 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Aucune conversation
          </div>
        ) : (
          filtered.map((conv, i) => {
            const name = conv.participant
              ? `${conv.participant.first_name || "Utilisateur"} ${conv.participant.last_name || ""}`.trim()
              : "Utilisateur";
            const isOnline = conv.participant ? onlineUsers.has(conv.participant.user_id) : false;
            const isActive = conv.id === activeId;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 hover:bg-muted/70 animate-fade-in ${
                  isActive ? "bg-primary/10" : ""
                }`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="relative shrink-0">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${conv.participant?.user_id}`} />
                    <AvatarFallback>{name[0]}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {name}
                    </span>
                    {conv.last_message_at && (
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: fr })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${conv.unread_count > 0 ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {conv.last_message_text || "📷 Image"}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 animate-scale-in">
                    {conv.unread_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ConversationList;
