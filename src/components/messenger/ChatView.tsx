import { useState, useRef, useEffect } from "react";
import { useConversationMessages, Conversation } from "@/hooks/useMessages";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Send, Image, Smile, ArrowLeft, Phone, Video, Info } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const participantName = conversation.participant
    ? `${conversation.participant.first_name || "Utilisateur"} ${conversation.participant.last_name || ""}`.trim()
    : "Utilisateur";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "HH:mm");
    if (isYesterday(date)) return `Hier ${format(date, "HH:mm")}`;
    return format(date, "d MMM HH:mm", { locale: fr });
  };

  // Group messages by date
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
      <div className="flex items-center gap-3 p-3 border-b border-border bg-card/80 backdrop-blur-sm">
        <button onClick={onBack} className="lg:hidden w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="relative">
          <Avatar className="w-10 h-10">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${conversation.participant?.user_id}`} />
            <AvatarFallback>{participantName[0]}</AvatarFallback>
          </Avatar>
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">{participantName}</h3>
          <p className="text-xs text-muted-foreground">
            {isOnline ? "En ligne" : "Hors ligne"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Phone className="w-4 h-4 text-primary" />
          </button>
          <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Video className="w-4 h-4 text-primary" />
          </button>
          <button className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors">
            <Info className="w-4 h-4 text-primary" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Avatar className="w-16 h-16">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${conversation.participant?.user_id}`} />
              <AvatarFallback>{participantName[0]}</AvatarFallback>
            </Avatar>
            <p className="font-semibold text-foreground">{participantName}</p>
            <p className="text-sm text-muted-foreground">Commencez une conversation</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex items-center justify-center my-3">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
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
                    className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isLast ? "mb-2" : "mb-0.5"} animate-fade-in`}
                  >
                    {!isMine && (
                      <div className="w-7 shrink-0">
                        {showAvatar && (
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={`https://i.pravatar.cc/150?u=${conversation.participant?.user_id}`} />
                            <AvatarFallback className="text-xs">{participantName[0]}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className={`group max-w-[70%] ${isMine ? "items-end" : "items-start"}`}>
                      {msg.image_url && (
                        <img
                          src={msg.image_url}
                          alt="image"
                          className="max-w-full max-h-64 rounded-2xl object-cover mb-1 cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      )}
                      {msg.content && (
                        <div
                          className={`px-3 py-2 text-sm leading-relaxed ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                      )}
                      {isLast && (
                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMine ? "text-right" : "text-left"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {formatTime(msg.created_at)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card">
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
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
          >
            <Image className="w-4 h-4 text-primary" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowEmoji(!showEmoji)}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
            >
              <Smile className="w-4 h-4 text-primary" />
            </button>
            {showEmoji && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmoji(false)} />
                <div className="absolute bottom-12 left-0 z-50 animate-scale-in">
                  <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
                </div>
              </>
            )}
          </div>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Aa"
            className="flex-1 rounded-full bg-muted border-0 h-9 text-sm"
            disabled={uploading}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() && !uploading}
            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
