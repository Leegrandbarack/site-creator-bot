import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  updated_at: string;
  participant: {
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  is_read: boolean;
}

export function useMessages(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const { data: participations } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (!participations || participations.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const convIds = participations.map((p) => p.conversation_id);

    const { data: convos } = await supabase
      .from("conversations")
      .select("*")
      .in("id", convIds)
      .order("last_message_at", { ascending: false });

    if (!convos) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", userId);

    const otherUserIds = [...new Set((allParticipants || []).map((p) => p.user_id))];

    const { data: profiles } = otherUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name, avatar_url").in("user_id", otherUserIds)
      : { data: [] };

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    const participantMap = new Map((allParticipants || []).map((p) => [p.conversation_id, p.user_id]));

    const { data: unreadMessages } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convIds)
      .neq("sender_id", userId)
      .eq("is_read", false);

    const unreadMap = new Map<string, number>();
    (unreadMessages || []).forEach((m) => {
      unreadMap.set(m.conversation_id, (unreadMap.get(m.conversation_id) || 0) + 1);
    });

    const result: Conversation[] = convos.map((c) => {
      const otherUserId = participantMap.get(c.id);
      const profile = otherUserId ? profileMap.get(otherUserId) : null;
      return {
        id: c.id,
        last_message_text: c.last_message_text,
        last_message_at: c.last_message_at,
        updated_at: c.updated_at,
        participant: profile
          ? { user_id: profile.user_id, first_name: profile.first_name, last_name: profile.last_name, avatar_url: profile.avatar_url }
          : otherUserId
          ? { user_id: otherUserId, first_name: null, last_name: null, avatar_url: null }
          : null,
        unread_count: unreadMap.get(c.id) || 0,
      };
    });

    setConversations(result);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getOrCreateConversation = async (otherUserId: string): Promise<string | null> => {
    if (!userId) return null;

    const { data: myConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userId);

    if (myConvos && myConvos.length > 0) {
      const myConvIds = myConvos.map((c) => c.conversation_id);
      const { data: shared } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", otherUserId)
        .in("conversation_id", myConvIds);

      if (shared && shared.length > 0) {
        return shared[0].conversation_id;
      }
    }

    const { data: convId, error: convError } = await supabase
      .rpc("create_conversation_with_participant", { other_user_id: otherUserId });

    if (convError || !convId) return null;

    await fetchConversations();
    return newConv.id;
  };

  return { conversations, loading, fetchConversations, getOrCreateConversation };
}

export function useConversationMessages(conversationId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(data || []);
    setLoading(false);

    if (userId) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId)
        .eq("is_read", false);
    }
  }, [conversationId, userId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => [...prev, newMsg]);
        if (userId && newMsg.sender_id !== userId) {
          supabase.from("messages").update({ is_read: true }).eq("id", newMsg.id);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, userId]);

  const sendMessage = async (content: string | null, imageUrl: string | null) => {
    if (!conversationId || !userId) return;
    if (!content && !imageUrl) return;
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: userId,
      content,
      image_url: imageUrl,
    });
  };

  return { messages, loading, sendMessage, fetchMessages };
}

export function usePresence(userId: string | null) {
  useEffect(() => {
    if (!userId) return;

    const upsertPresence = async (online: boolean) => {
      await supabase.from("user_presence").upsert(
        { user_id: userId, is_online: online, last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    };

    upsertPresence(true);
    const interval = setInterval(() => upsertPresence(true), 30000);

    const handleVisibility = () => {
      upsertPresence(document.visibilityState === "visible");
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      upsertPresence(false);
    };
  }, [userId]);
}
