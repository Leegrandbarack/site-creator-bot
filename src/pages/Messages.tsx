import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, UserPlus } from "lucide-react";
import { useMessages, usePresence } from "@/hooks/useMessages";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import ConversationList from "@/components/messenger/ConversationList";
import ChatView from "@/components/messenger/ChatView";
import NewConversationDialog from "@/components/messenger/NewConversationDialog";
import { useNavigate } from "react-router-dom";

const Messages = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showNewConv, setShowNewConv] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", firstName: "U", avatar: "https://i.pravatar.cc/150?img=3" });
  const navigate = useNavigate();

  const { conversations, loading, fetchConversations, getOrCreateConversation } = useMessages(userId);
  usePresence(userId);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profile) {
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur";
        setUserInfo({
          name,
          firstName: profile.first_name || "U",
          avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${session.user.id}`,
        });
      }
      setIsReady(true);
    };
    init();
  }, [navigate]);

  // Fetch online users
  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase.from("user_presence").select("user_id").eq("is_online", true);
      setOnlineUsers(new Set((data || []).map((p) => p.user_id)));
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);

    const channel = supabase
      .channel("presence-changes-msg")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => {
        fetchPresence();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Realtime conversation updates
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => {
        fetchConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchConversations]);

  const handleNewConversation = async (otherUserId: string) => {
    const convId = await getOrCreateConversation(otherUserId);
    if (convId) {
      setActiveConvId(convId);
      setShowNewConv(false);
    }
  };

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
      <DashboardNavbar user={userInfo} />
      <div className="pt-14 flex h-[calc(100vh-3.5rem)] max-w-[1400px] mx-auto">
        {/* Conversation list */}
        <div className={`w-full lg:w-[360px] shrink-0 border-r border-border bg-card ${activeConvId ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
          <ConversationList
            conversations={conversations}
            activeId={activeConvId}
            onSelect={setActiveConvId}
            onlineUsers={onlineUsers}
            onNewConversation={() => setShowNewConv(true)}
            loading={loading}
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
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <MessageSquare className="w-12 h-12 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-foreground">Vos messages</p>
                <p className="text-sm mt-1">Sélectionnez une conversation ou démarrez-en une nouvelle</p>
              </div>
              <button
                onClick={() => setShowNewConv(true)}
                className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New conversation dialog */}
      {showNewConv && userId && (
        <NewConversationDialog
          userId={userId}
          onSelect={handleNewConversation}
          onClose={() => setShowNewConv(false)}
        />
      )}
    </div>
  );
};

export default Messages;
