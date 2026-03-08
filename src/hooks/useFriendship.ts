import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type FriendshipStatus = "none" | "pending_sent" | "pending_received" | "accepted";

interface FriendshipState {
  status: FriendshipStatus;
  friendshipId: string | null;
}

export function useFriendship(currentUserId: string | null, targetUserId: string | null) {
  const [state, setState] = useState<FriendshipState>({ status: "none", friendshipId: null });
  const [isLoading, setIsLoading] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);

  const fetchStatus = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    const { data } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUserId}),and(requester_id.eq.${targetUserId},addressee_id.eq.${currentUserId})`
      )
      .limit(1)
      .maybeSingle();

    if (!data) {
      setState({ status: "none", friendshipId: null });
    } else if (data.status === "accepted") {
      setState({ status: "accepted", friendshipId: data.id });
    } else if (data.status === "pending" && data.requester_id === currentUserId) {
      setState({ status: "pending_sent", friendshipId: data.id });
    } else if (data.status === "pending" && data.addressee_id === currentUserId) {
      setState({ status: "pending_received", friendshipId: data.id });
    } else {
      setState({ status: "none", friendshipId: null });
    }
  }, [currentUserId, targetUserId]);

  const fetchFriendsCount = useCallback(async () => {
    if (!targetUserId) return;
    const { count } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${targetUserId},addressee_id.eq.${targetUserId}`);
    setFriendsCount(count || 0);
  }, [targetUserId]);

  useEffect(() => {
    fetchStatus();
    fetchFriendsCount();
  }, [fetchStatus, fetchFriendsCount]);

  const sendRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("friendships").insert({
        requester_id: currentUserId,
        addressee_id: targetUserId,
      }).select().single();
      if (error) throw error;

      // Create notification
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "friend_request",
        message: "vous a envoyé une demande d'ami",
        from_user_id: currentUserId,
        reference_id: data.id,
      });

      setState({ status: "pending_sent", friendshipId: data.id });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptRequest = async () => {
    if (!state.friendshipId || !currentUserId || !targetUserId) return;
    setIsLoading(true);
    try {
      await supabase.from("friendships").update({ status: "accepted" }).eq("id", state.friendshipId);

      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "friend_accepted",
        message: "a accepté votre demande d'ami",
        from_user_id: currentUserId,
        reference_id: state.friendshipId,
      });

      setState({ status: "accepted", friendshipId: state.friendshipId });
      fetchFriendsCount();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const rejectRequest = async () => {
    if (!state.friendshipId) return;
    setIsLoading(true);
    try {
      await supabase.from("friendships").delete().eq("id", state.friendshipId);
      setState({ status: "none", friendshipId: null });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async () => {
    if (!state.friendshipId) return;
    setIsLoading(true);
    try {
      await supabase.from("friendships").delete().eq("id", state.friendshipId);
      setState({ status: "none", friendshipId: null });
      fetchFriendsCount();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...state,
    isLoading,
    friendsCount,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    refresh: () => { fetchStatus(); fetchFriendsCount(); },
  };
}
