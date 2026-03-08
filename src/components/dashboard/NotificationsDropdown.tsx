import { useState, useEffect } from "react";
import { Bell, UserPlus, UserCheck, Check, X, Heart, MessageCircle, MessageSquare, ThumbsUp } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface NotificationsDropdownProps {
  userId: string;
}

const NotificationsDropdown = ({ userId }: NotificationsDropdownProps) => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications(userId);
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar: string | null }>>({});

  // Fetch profiles for notification senders
  useEffect(() => {
    const fromIds = [...new Set(notifications.map(n => n.from_user_id).filter(Boolean))] as string[];
    if (fromIds.length === 0) return;

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", fromIds);
      if (data) {
        const map: Record<string, { name: string; avatar: string | null }> = {};
        data.forEach(p => {
          map[p.user_id] = {
            name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur",
            avatar: p.avatar_url,
          };
        });
        setProfiles(map);
      }
    };
    fetchProfiles();
  }, [notifications]);

  const handleAcceptFriend = async (notif: any) => {
    if (!notif.reference_id) return;
    try {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", notif.reference_id);
      await markRead(notif.id);
      await supabase.from("notifications").insert({
        user_id: notif.from_user_id,
        type: "friend_accepted",
        message: "a accepté votre demande d'ami",
        from_user_id: userId,
        reference_id: notif.reference_id,
      });
      toast.success("Demande d'ami acceptée !");
    } catch {
      toast.error("Erreur");
    }
  };

  const handleRejectFriend = async (notif: any) => {
    if (!notif.reference_id) return;
    try {
      await supabase.from("friendships").delete().eq("id", notif.reference_id);
      await markRead(notif.id);
      toast.success("Demande refusée");
    } catch {
      toast.error("Erreur");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "friend_request": return <UserPlus className="w-4 h-4 text-primary" />;
      case "friend_accepted": return <UserCheck className="w-4 h-4 text-green-500" />;
      case "post_like": return <Heart className="w-4 h-4 text-destructive" />;
      case "comment_like": return <ThumbsUp className="w-4 h-4 text-primary" />;
      case "post_comment": return <MessageCircle className="w-4 h-4 text-primary" />;
      case "comment_reply": return <MessageCircle className="w-4 h-4 text-primary" />;
      case "message": return <MessageSquare className="w-4 h-4 text-primary" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case "post_like": return "bg-destructive/10";
      case "comment_like": return "bg-primary/10";
      case "post_comment": return "bg-primary/10";
      case "comment_reply": return "bg-primary/10";
      case "friend_request": return "bg-primary/10";
      case "friend_accepted": return "bg-primary/10";
      case "message": return "bg-primary/10";
      default: return "bg-muted";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors group"
      >
        <Bell className="w-5 h-5 text-foreground group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-xl border border-border z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-bold text-foreground text-lg">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline font-medium">
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const sender = notif.from_user_id ? profiles[notif.from_user_id] : null;
                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-all duration-200 cursor-pointer ${
                        !notif.is_read ? "bg-primary/5" : ""
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                    >
                      <div className="relative shrink-0">
                        <Avatar className="w-10 h-10 ring-2 ring-background">
                          <AvatarImage src={sender?.avatar || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {(sender?.name?.[0] || "U").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center ${getIconBg(notif.type)}`}>
                          {getIcon(notif.type)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-snug">
                          <span className="font-semibold">{sender?.name || "Utilisateur"}</span>{" "}
                          {notif.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                        </p>

                        {notif.type === "friend_request" && !notif.is_read && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAcceptFriend(notif); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              <Check className="w-3 h-3" /> Accepter
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRejectFriend(notif); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                            >
                              <X className="w-3 h-3" /> Refuser
                            </button>
                          </div>
                        )}
                      </div>
                      {!notif.is_read && (
                        <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5 animate-pulse" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;
