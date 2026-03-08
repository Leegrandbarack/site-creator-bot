import { useState, useRef, useEffect, useCallback } from "react";
import { useConversationMessages, Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Send, Image, Smile, ArrowLeft, Phone, Video, MoreVertical, Trash2, Loader2, Paperclip, Check, CheckCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isYesterday } from "date-fns";
import { fr } from "date-fns/locale";
import EmojiPicker from "@/components/dashboard/EmojiPicker";
import { toast } from "sonner";

interface ChatViewProps {
  conversation: Conversation;
  userId: string;
  isOnline: boolean;
  onBack: () => void;
}

const ChatView = ({ conversation, userId, isOnline, onBack }: ChatViewProps) => {
  const { messages, loading, sendMessage } = useConversationMessages(conversation.id, userId);
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const participantName = conversation.participant
    ? `${conversation.participant.first_name || "Utilisateur"} ${conversation.participant.last_name || ""}`.trim()
    : "Utilisateur";

  const participantAvatar = conversation.participant?.avatar_url || undefined;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [conversation.id]);

  const simulateTyping = useCallback(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id === userId) {
        const timer = setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 2000 + Math.random() * 3000);
        }, 1000 + Math.random() * 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, userId]);

  useEffect(() => {
    simulateTyping();
  }, [simulateTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 120) + "px";
    }
  }, [text]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    setShowEmoji(false);
    await sendMessage(msg, null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("message-images").upload(path, file);
    if (error) {
      toast.error("Erreur d'upload");
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("message-images").getPublicUrl(path);
    await sendMessage(null, urlData.publicUrl);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const handleDeleteConversation = async () => {
    try {
      await supabase.from("messages").delete().eq("conversation_id", conversation.id);
      await supabase.from("conversation_participants").delete().eq("conversation_id", conversation.id);
      await supabase.from("conversations").delete().eq("id", conversation.id);
      toast.success("Conversation supprimée");
      onBack();
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return `Hier ${format(date, "HH:mm")}`;
    return format(date, "d MMM HH:mm", { locale: fr });
  };

  const groupedMessages: { date: string; msgs: typeof messages }[] = [];
  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.created_at), "yyyy-MM-dd");
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) {
      last.msgs.push(msg);
    } else {
      groupedMessages.push({ date: dateKey, msgs: [msg] });
    }
  });

  const formatDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    if (isYesterday(date)) return "Hier";
    return format(date, "d MMMM yyyy", { locale: fr });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/80 backdrop-blur-md shadow-[0_1px_3px_hsl(var(--foreground)/0.05)] z-10">
        <button
          onClick={onBack}
          className="lg:hidden w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-all duration-200 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="relative cursor-pointer group">
          <Avatar className="w-10 h-10 ring-2 ring-transparent group-hover:ring-primary/20 transition-all duration-300">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
              {participantName[0]}
            </AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-[15px] truncate">{participantName}</h3>
          <p className="text-xs text-muted-foreground">
            {isTyping ? (
              <span className="text-primary font-medium flex items-center gap-1">
                En train d'écrire
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              </span>
            ) : isOnline ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full" /> Actif(ve) maintenant
              </span>
            ) : (
              "Hors ligne"
            )}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {[
            { icon: Phone, label: "Appel audio" },
            { icon: Video, label: "Appel vidéo" },
          ].map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all duration-200 active:scale-95 group"
              title={label}
            >
              <Icon className="w-[18px] h-[18px] text-primary group-hover:scale-110 transition-transform" />
            </button>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all duration-200 active:scale-95">
                <MoreVertical className="w-[18px] h-[18px] text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-lg border-border/50 rounded-xl">
              <DropdownMenuItem
                onClick={handleDeleteConversation}
                className="cursor-pointer gap-2 text-destructive focus:text-destructive rounded-lg"
              >
                <Trash2 className="w-4 h-4" /> Supprimer la conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gradient-to-b from-muted/20 to-muted/40 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Chargement des messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-fade-in">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/10">
                <AvatarImage src={participantAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-bold">
                  {participantName[0]}
                </AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-3 border-background rounded-full" />
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-xl text-foreground">{participantName}</p>
              <p className="text-sm text-muted-foreground mt-1">Vous êtes maintenant connectés sur Messenger</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Envoyez votre premier message 👋</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-5">
                <span className="text-[11px] text-muted-foreground bg-card/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-border/50 font-medium">
                  {formatDateHeader(group.date)}
                </span>
              </div>
              {group.msgs.map((msg, i) => {
                const isMine = msg.sender_id === userId;
                const showAvatar = !isMine && (i === 0 || group.msgs[i - 1]?.sender_id !== msg.sender_id);
                const isLast = i === group.msgs.length - 1 || group.msgs[i + 1]?.sender_id !== msg.sender_id;
                const isFirst = i === 0 || group.msgs[i - 1]?.sender_id !== msg.sender_id;
                const isHovered = hoveredMsg === msg.id;

                // Bubble radius logic for grouped messages
                const getBubbleRadius = () => {
                  if (isMine) {
                    if (isFirst && isLast) return "rounded-[20px]";
                    if (isFirst) return "rounded-[20px] rounded-br-[6px]";
                    if (isLast) return "rounded-[20px] rounded-tr-[6px]";
                    return "rounded-[20px] rounded-r-[6px]";
                  } else {
                    if (isFirst && isLast) return "rounded-[20px]";
                    if (isFirst) return "rounded-[20px] rounded-bl-[6px]";
                    if (isLast) return "rounded-[20px] rounded-tl-[6px]";
                    return "rounded-[20px] rounded-l-[6px]";
                  }
                };

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-3" : "mb-[3px]"}`}
                    onMouseEnter={() => setHoveredMsg(msg.id)}
                    onMouseLeave={() => setHoveredMsg(null)}
                    style={{
                      animation: "msgSlideIn 0.25s ease-out both",
                      animationDelay: `${Math.min(i * 30, 300)}ms`,
                    }}
                  >
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {showAvatar && (
                          <Avatar className="w-7 h-7 shadow-sm">
                            <AvatarImage src={participantAvatar} />
                            <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                              {participantName[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}

                    <div className={`group max-w-[65%] relative ${isMine ? "items-end" : "items-start"}`}>
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="image"
                          className={`max-w-full max-h-72 ${getBubbleRadius()} object-cover mb-1 cursor-pointer hover:brightness-95 transition-all duration-200 shadow-md`}
                        />
                      )}
                      {msg.content && (
                        <div
                          className={`px-4 py-2.5 text-[14px] leading-relaxed transition-all duration-200 ${getBubbleRadius()} ${
                            isMine
                              ? "bg-primary text-primary-foreground shadow-[0_1px_4px_hsl(var(--primary)/0.3)]"
                              : "bg-card text-foreground shadow-[0_1px_3px_hsl(var(--foreground)/0.06)] border border-border/40"
                          } ${isHovered ? "brightness-[0.97]" : ""}`}
                        >
                          {msg.content}
                        </div>
                      )}
                      {/* Time & read status */}
                      <div
                        className={`flex items-center gap-1 mt-1 px-1 transition-all duration-300 ${
                          isHovered || isLast ? "opacity-100 max-h-5" : "opacity-0 max-h-0 overflow-hidden"
                        } ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <span className="text-[10px] text-muted-foreground">
                          {formatTime(msg.created_at)}
                        </span>
                        {isMine && (
                          msg.is_read ? (
                            <CheckCheck className="w-3 h-3 text-primary" />
                          ) : (
                            <Check className="w-3 h-3 text-muted-foreground" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 justify-start mb-2 animate-fade-in">
            <Avatar className="w-7 h-7 shadow-sm">
              <AvatarImage src={participantAvatar} />
              <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">
                {participantName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border/40 rounded-[20px] rounded-bl-[6px] px-5 py-3 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "400ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-3 py-3 border-t border-border/50 bg-card/80 backdrop-blur-md">
        {showEmoji && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
            <div className="relative z-50 mb-3 animate-scale-in origin-bottom">
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            </div>
          </>
        )}
        <div className="flex items-end gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-95"
              title="Envoyer une image"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Paperclip className="w-5 h-5 text-primary" />
              )}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-95"
              title="Photo"
            >
              <Image className="w-5 h-5 text-primary" />
            </button>
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className={`w-9 h-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-all duration-200 shrink-0 active:scale-95 ${showEmoji ? "bg-primary/10" : ""}`}
              title="Emoji"
            >
              <Smile className="w-5 h-5 text-primary" />
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écris un message…"
              rows={1}
              className="w-full resize-none rounded-2xl bg-muted/60 border-0 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 max-h-[120px] scrollbar-thin"
              disabled={uploading}
              style={{ minHeight: "40px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() && !uploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 active:scale-90 ${
              text.trim()
                ? "bg-primary shadow-[0_2px_8px_hsl(var(--primary)/0.4)] hover:shadow-[0_4px_12px_hsl(var(--primary)/0.5)] hover:scale-105"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Send className={`w-4 h-4 transition-all duration-300 ${text.trim() ? "text-primary-foreground translate-x-[1px]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes msgSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatView;
