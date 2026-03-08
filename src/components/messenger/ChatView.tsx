import { useState, useRef, useEffect, useCallback } from "react";
import { useConversationMessages, Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, Image, Smile, ArrowLeft, Phone, Video, MoreVertical, Trash2, Loader2 } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const participantName = conversation.participant
    ? `${conversation.participant.first_name || "Utilisateur"} ${conversation.participant.last_name || ""}`.trim()
    : "Utilisateur";

  const participantAvatar = conversation.participant?.avatar_url || `https://i.pravatar.cc/150?u=${conversation.participant?.user_id}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
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
    inputRef.current?.focus();
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

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shadow-sm">
        <button onClick={onBack} className="lg:hidden w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="relative cursor-pointer">
          <Avatar className="w-10 h-10">
            <AvatarImage src={participantAvatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{participantName[0]}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{participantName}</h3>
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
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full" /> En ligne
              </span>
            ) : (
              "Hors ligne"
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Phone className="w-5 h-5 text-primary" />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Video className="w-5 h-5 text-primary" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
                <MoreVertical className="w-5 h-5 text-primary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleDeleteConversation} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                <Trash2 className="w-4 h-4" /> Supprimer la conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-muted/30">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Avatar className="w-20 h-20">
              <AvatarImage src={participantAvatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">{participantName[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-lg text-foreground">{participantName}</p>
            <p className="text-sm text-muted-foreground">Envoyez votre premier message 👋</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-4">
                <span className="text-xs text-muted-foreground bg-card px-3 py-1 rounded-full shadow-sm border border-border">
                  {formatDateHeader(group.date)}
                </span>
              </div>
              {group.msgs.map((msg, i) => {
                const isMine = msg.sender_id === userId;
                const showAvatar = !isMine && (i === 0 || group.msgs[i - 1]?.sender_id !== msg.sender_id);
                const isLast = i === group.msgs.length - 1 || group.msgs[i + 1]?.sender_id !== msg.sender_id;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-3" : "mb-0.5"} animate-fade-in`}
                  >
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {showAvatar && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={participantAvatar} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">{participantName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={`group max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="image"
                          className="max-w-full max-h-64 rounded-2xl object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                        />
                      )}
                      {msg.content && (
                        <div
                          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-card text-foreground rounded-2xl rounded-bl-md border border-border"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                      {isLast && (
                        <p className={`text-[10px] text-muted-foreground mt-1 px-1 ${isMine ? "text-right" : "text-left"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.created_at)}
                          {isMine && msg.is_read && " · Lu"}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-end gap-2 justify-start mb-2 animate-fade-in">
            <Avatar className="w-7 h-7">
              <AvatarImage src={participantAvatar} />
              <AvatarFallback className="text-xs">{participantName[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
        {showEmoji && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
            <div className="relative z-50 mb-2 animate-scale-in">
              <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
            </div>
          </>
        )}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0"
            title="Envoyer une image"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <Image className="w-5 h-5 text-primary" />
            )}
          </button>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center transition-colors shrink-0 ${showEmoji ? "bg-muted" : ""}`}
            title="Emoji"
          >
            <Smile className="w-5 h-5 text-primary" />
          </button>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Aa"
            className="flex-1 rounded-full bg-muted border-0 h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary/30"
            disabled={uploading}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() && !uploading}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-all shrink-0 disabled:opacity-40 active:scale-95"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
