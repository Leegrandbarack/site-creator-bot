import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, MessageSquare, UserPlus } from "lucide-react";
import { useMessages, usePresence } from "@/hooks/useMessages";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import ConversationList from "@/components/messenger/ConversationList";
import ChatView from "@/components/messenger/ChatView";
import NewConversationDialog from "@/components/messenger/NewConversationDialog";
import { useNavigate, useSearchParams } from "react-router-dom";

const Messages = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showNewConv, setShowNewConv] = useState(false);
  const [userInfo, setUserInfo] = useState({ name: "Utilisateur", firstName: "U", avatar: "" });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { conversations, loading, fetchConversations, getOrCreateConversation } = useMessages(userId);
  usePresence(userId);

  useEffect(() => {
    const convParam = searchParams.get("conversation");
    if (convParam) setActiveConvId(convParam);
  }, [searchParams]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (profile) {
        const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Utilisateur";
        setUserInfo({ name, firstName: profile.first_name || "U", avatar: profile.avatar_url || "" });
      }
      setIsReady(true);
    };
    init();
  }, [navigate]);

  useEffect(() => {
    const fetchPresence = async () => {
      const { data } = await supabase.from("user_presence").select("user_id").eq("is_online", true);
      setOnlineUsers(new Set((data || []).map((p) => p.user_id)));
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 15000);
    const channel = supabase
      .channel("presence-changes-msg")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, () => fetchPresence())
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel("conversations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => fetchConversations())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => fetchConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchConversations]);

  const handleNewConversation = async (otherUserId: string) => {
    const convId = await getOrCreateConversation(otherUserId);
    if (convId) { setActiveConvId(convId); setShowNewConv(false); }
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  if (!isReady) {
    return (
      <div className="min-h-screen pb-14 lg:pb-0 bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement de Messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar user={userInfo} />
      <div className="pt-14 flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar - Conversation List */}
        <div
          className={`w-full lg:w-[360px] xl:w-[380px] shrink-0 border-r border-border/50 bg-card shadow-[1px_0_3px_hsl(var(--foreground)/0.03)] ${
            activeConvId ? "hidden lg:flex lg:flex-col" : "flex flex-col"
          }`}
        >
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
            <div className="w-full h-full">
              <ChatView
                conversation={activeConversation}
                userId={userId}
                isOnline={activeConversation.participant ? onlineUsers.has(activeConversation.participant.user_id) : false}
                onBack={() => setActiveConvId(null)}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-5 text-muted-foreground bg-gradient-to-br from-background to-muted/30">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shadow-[0_8px_30px_hsl(var(--primary)/0.1)]">
                <MessageSquare className="w-14 h-14 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">Vos messages</p>
                <p className="text-sm mt-2 text-muted-foreground max-w-xs">
                  Sélectionnez une conversation ou commencez-en une nouvelle pour discuter
                </p>
              </div>
              <button
                onClick={() => setShowNewConv(true)}
                className="mt-2 px-7 py-3 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-300 flex items-center gap-2 shadow-[0_4px_14px_hsl(var(--primary)/0.35)] hover:shadow-[0_6px_20px_hsl(var(--primary)/0.45)] hover:scale-[1.02] active:scale-95"
              >
                <UserPlus className="w-4 h-4" /> Nouvelle conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showNewConv && userId && (
        <NewConversationDialog
          userId={userId}
          onSelect={handleNewConversation}
          onClose={() => setShowNewConv(false)}
        />
      )}
      <MobileBottomNav />

    </div>
  );
};

export default Messages;
