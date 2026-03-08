import { useState, useEffect } from "react";
import { Bell, UserPlus, UserCheck, Check, X } from "lucide-react";
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

  const handleAcceptFriend = async (notif: any) => {
    if (!notif.reference_id) return;
    try {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", notif.reference_id);
      await markRead(notif.id);

      // Notify requester
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
      case "friend_accepted": return <UserCheck className="w-4 h-4 text-secondary" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
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
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card rounded-xl shadow-xl border border-border z-50 animate-scale-in overflow-hidden">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="font-bold text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Tout marquer comme lu
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 p-3 hover:bg-muted/50 transition-colors animate-fade-in ${
                      !notif.is_read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${notif.from_user_id}`} />
                        <AvatarFallback>U</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-card rounded-full flex items-center justify-center">
                        {getIcon(notif.type)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">Utilisateur</span>{" "}
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: fr })}
                      </p>

                      {/* Friend request actions */}
                      {notif.type === "friend_request" && !notif.is_read && (
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleAcceptFriend(notif)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            <Check className="w-3 h-3" /> Accepter
                          </button>
                          <button
                            onClick={() => handleRejectFriend(notif)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                          >
                            <X className="w-3 h-3" /> Refuser
                          </button>
                        </div>
                      )}
                    </div>
                    {!notif.is_read && (
                      <span className="w-2.5 h-2.5 bg-primary rounded-full shrink-0 mt-1.5" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationsDropdown;
