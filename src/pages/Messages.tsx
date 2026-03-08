import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare } from "lucide-react";
import { useMessages, usePresence } from "@/hooks/useMessages";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ConversationList from "@/components/messenger/ConversationList";
import ChatView from "@/components/messenger/ChatView";

const Messages = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [user] = useState({
    name: "Utilisateur Demo",
    firstName: "Utilisateur",
    avatar: "https://i.pravatar.cc/150?img=3",
  });

  const { conversations, loading } = useMessages(userId);
  usePresence(userId);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
      } else {
        const { data } = await supabase.auth.signInAnonymously();
        if (data.session) setUserId(data.session.user.id);
      }
      setIsReady(true);
    };
    init();
  }, []);

  // Fetch online users
  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase.from("user_presence").select("user_id").eq("is_online", true);
      setOnlineUsers(new Set((data || []).map((p) => p.user_id)));
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);

    const channel = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchPresence();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  if (!isReady) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <DashboardNavbar user={user} />
      <div className="pt-14 flex h-[calc(100vh-3.5rem)] max-w-[1400px] mx-auto">
        {/* Conversation list */}
        <div className={`w-full lg:w-[360px] shrink-0 border-r border-border ${activeConvId ? "hidden lg:block" : "block"}`}>
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onlineUsers={onlineUsers}
          />
        </div>

        {/* Chat area */}
        <div className={`flex-1 min-w-0 ${!activeConvId ? "hidden lg:flex" : "flex"}`}>
          {activeConversation && userId ? (
            <div className="w-full">
              <ChatView
                conversation={activeConversation}
                userId={userId}
                isOnline={activeConversation.participant ? onlineUsers.has(activeConversation.participant.user_id) : false}
                onBack={() => setActiveConvId(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <MessageSquare className="w-10 h-10" />
              </div>
              <p className="text-lg font-medium text-foreground">Vos messages</p>
              <p className="text-sm">Sélectionnez une conversation pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
