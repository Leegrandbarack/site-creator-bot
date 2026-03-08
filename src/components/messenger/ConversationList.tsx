import { Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Edit, Loader2 } from "lucide-react";
import { useState } from "react";

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onlineUsers: Set<string>;
  onNewConversation: () => void;
  loading: boolean;
}

const ConversationList = ({ conversations, activeId, onSelect, onlineUsers, onNewConversation, loading }: ConversationListProps) => {
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name = `${c.participant?.first_name || ""} ${c.participant?.last_name || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Discussions</h2>
          <button
            onClick={onNewConversation}
            className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all duration-200 active:scale-95 group"
            title="Nouvelle conversation"
          >
            <Edit className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Rechercher dans Messenger"
            className="w-full pl-10 pr-4 h-10 rounded-full bg-muted/60 border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 scroll-smooth">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Chargement...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {search ? "Aucun résultat" : "Aucune conversation"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Essayez un autre nom" : "Commencez une nouvelle discussion"}
            </p>
            {!search && (
              <button
                onClick={onNewConversation}
                className="mt-4 px-5 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-all duration-200 active:scale-95 shadow-[0_2px_8px_hsl(var(--primary)/0.3)]"
              >
                Nouvelle conversation
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 py-1">
            {filtered.map((conv, i) => {
              const name = conv.participant
                ? `${conv.participant.first_name || "Utilisateur"} ${conv.participant.last_name || ""}`.trim()
                : "Utilisateur";
              const avatarUrl = conv.participant?.avatar_url || undefined;
              const isOnline = conv.participant ? onlineUsers.has(conv.participant.user_id) : false;
              const isActive = conv.id === activeId;
              const hasUnread = conv.unread_count > 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary/10 shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.15)]"
                      : "hover:bg-muted/70 hover:shadow-[0_2px_8px_hsl(var(--foreground)/0.04)]"
                  }`}
                  style={{
                    animation: "convSlideIn 0.2s ease-out both",
                    animationDelay: `${i * 25}ms`,
                  }}
                >
                  <div className="relative shrink-0">
                    <Avatar className={`w-12 h-12 transition-all duration-200 ${isActive ? "ring-2 ring-primary/20" : "group-hover:ring-2 group-hover:ring-muted"}`}>
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-sm">
                        {name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-[2.5px] border-card rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`text-[14px] truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                        {name}
                      </span>
                      {conv.last_message_at && (
                        <span className={`text-[11px] shrink-0 ml-2 ${hasUnread ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                          {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false, locale: fr })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[13px] truncate mt-0.5 ${hasUnread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {conv.last_message_text || "📷 Photo"}
                    </p>
                  </div>
                  {hasUnread && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 shadow-[0_2px_6px_hsl(var(--primary)/0.4)] animate-scale-in">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes convSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ConversationList;
