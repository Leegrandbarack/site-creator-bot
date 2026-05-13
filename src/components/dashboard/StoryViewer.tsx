import { useState, useEffect, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Pause, Play, Eye, Send, Trash2, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export interface StoryItem {
  id: string;
  user_id: string;
  media_url: string | null;
  media_type: string;
  text_content: string | null;
  background_color: string | null;
  created_at: string;
  expires_at: string;
}

interface Group {
  user_id: string;
  name: string;
  avatar: string;
  stories: StoryItem[];
  hasUnseen: boolean;
}

interface StoryViewerProps {
  groups: Group[];
  initialGroupIndex: number;
  currentUserId: string;
  onClose: () => void;
}

const STORY_DURATION = 5000;
const REACTIONS = ["❤️", "🔥", "😂", "😮", "😢", "👏"];

const StoryViewer = ({ groups, initialGroupIndex, currentUserId, onClose }: StoryViewerProps) => {
  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [viewers, setViewers] = useState<{ user_id: string; name: string; avatar: string }[]>([]);
  const [showViewers, setShowViewers] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const animRef = useRef<number>(0);
  const startRef = useRef<number>(0);

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];
  const isOwner = story?.user_id === currentUserId;

  const close = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 250);
  }, [onClose]);

  const goNext = useCallback(() => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
      setProgress(0);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((i) => i + 1);
      setStoryIdx(0);
      setProgress(0);
    } else {
      close();
    }
  }, [storyIdx, groupIdx, group, groups.length, close]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
      setProgress(0);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((i) => i - 1);
      setStoryIdx(prevGroup.stories.length - 1);
      setProgress(0);
    }
  }, [storyIdx, groupIdx, groups]);

  // Mark as viewed + load viewers
  useEffect(() => {
    if (!story) return;
    if (!isOwner) {
      supabase.from("story_views").insert({ story_id: story.id, viewer_id: currentUserId }).then(() => {});
    } else {
      // Load viewers
      (async () => {
        const { data } = await supabase
          .from("story_views")
          .select("viewer_id")
          .eq("story_id", story.id);
        if (!data) return;
        const ids = data.map((v) => v.viewer_id);
        if (ids.length === 0) return setViewers([]);
        const { data: profs } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, avatar_url")
          .in("user_id", ids);
        setViewers(
          (profs || []).map((p) => ({
            user_id: p.user_id,
            name: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Utilisateur",
            avatar: p.avatar_url || `https://i.pravatar.cc/150?u=${p.user_id}`,
          }))
        );
      })();
    }
  }, [story, isOwner, currentUserId]);

  // Progress timer
  useEffect(() => {
    if (isPaused || !story) return;
    startRef.current = performance.now() - (progress / 100) * STORY_DURATION;
    const tick = (now: number) => {
      const pct = Math.min(((now - startRef.current) / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) { goNext(); return; }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [story, isPaused, goNext]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close, goNext, goPrev]);

  const sendReaction = async (emoji: string) => {
    if (!story || isOwner) return;
    setIsPaused(true);
    await supabase.from("story_reactions").insert({
      story_id: story.id,
      user_id: currentUserId,
      emoji,
    });
    toast.success(`Réaction ${emoji} envoyée`);
    setIsPaused(false);
  };

  const sendReply = async () => {
    if (!reply.trim() || !story || isOwner) return;
    setSending(true);
    setIsPaused(true);
    try {
      // Find or create conversation with story owner
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);
      const myConvIds = (existing || []).map((c) => c.conversation_id);
      let convId: string | null = null;
      if (myConvIds.length > 0) {
        const { data: shared } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", story.user_id)
          .in("conversation_id", myConvIds);
        if (shared && shared.length > 0) convId = shared[0].conversation_id;
      }
      if (!convId) {
        const { data, error } = await supabase.rpc("create_conversation_with_participant", {
          other_user_id: story.user_id,
        });
        if (error) throw error;
        convId = data as string;
      }
      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: `↪️ Réponse à votre story : ${reply.trim()}`,
      });
      toast.success("Réponse envoyée");
      setReply("");
    } catch {
      toast.error("Erreur");
    } finally {
      setSending(false);
      setIsPaused(false);
    }
  };

  const handleDelete = async () => {
    if (!story) return;
    if (!confirm("Supprimer cette story ?")) return;
    await supabase.from("stories").delete().eq("id", story.id);
    toast.success("Story supprimée");
    goNext();
  };

  const handleAreaClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) goPrev();
    else if (x > (rect.width * 2) / 3) goNext();
    else setIsPaused((p) => !p);
  };

  if (!story || !group) return null;

  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: fr });

  return (
    <div className={`fixed inset-0 z-[100] bg-black/95 flex items-center justify-center transition-opacity duration-250 ${exiting ? "opacity-0" : "opacity-100 animate-fade-in"}`}>
      <button onClick={close} className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20">
        <X className="w-6 h-6 text-white" />
      </button>

      {(groupIdx > 0 || storyIdx > 0) && (
        <button onClick={goPrev} className="absolute left-4 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 hidden md:flex">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}
      {(groupIdx < groups.length - 1 || storyIdx < group.stories.length - 1) && (
        <button onClick={goNext} className="absolute right-16 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 hidden md:flex">
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      <div className="relative w-full max-w-[420px] h-[85vh] max-h-[750px] rounded-2xl overflow-hidden shadow-2xl" onClick={handleAreaClick}>
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-30 flex gap-1 p-3 pb-0">
          {group.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[3px] rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-30 flex items-center gap-3 px-4">
          <div className="p-0.5 rounded-full bg-gradient-to-tr from-pink-500 via-primary to-blue-400">
            <Avatar className="w-10 h-10 border-2 border-black">
              <AvatarImage src={group.avatar} />
              <AvatarFallback className="text-xs bg-muted">{group.name[0]}</AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{group.name}</p>
            <p className="text-white/60 text-xs">{timeAgo}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setIsPaused((p) => !p); }} className="p-2 rounded-full hover:bg-white/10">
            {isPaused ? <Play className="w-5 h-5 text-white" /> : <Pause className="w-5 h-5 text-white" />}
          </button>
          {isOwner && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="p-2 rounded-full hover:bg-white/10">
              <Trash2 className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Content */}
        {story.media_url ? (
          <img src={story.media_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-8 text-white text-3xl font-bold text-center"
            style={{ background: story.background_color || "linear-gradient(135deg,#667eea,#764ba2)" }}
          >
            {story.text_content}
          </div>
        )}

        {story.text_content && story.media_url && (
          <div className="absolute bottom-20 left-0 right-0 px-6 text-center">
            <p className="text-white text-base font-medium drop-shadow-lg bg-black/30 inline-block px-4 py-2 rounded-2xl">
              {story.text_content}
            </p>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />

        {/* Bottom: reply OR viewers */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-3" onClick={(e) => e.stopPropagation()}>
          {isOwner ? (
            <button
              onClick={() => { setShowViewers(true); setIsPaused(true); }}
              className="w-full flex items-center gap-2 text-white/90 text-sm bg-black/40 backdrop-blur px-4 py-2.5 rounded-full hover:bg-black/50"
            >
              <Eye className="w-4 h-4" />
              {viewers.length} {viewers.length > 1 ? "vues" : "vue"}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center gap-1">
                {REACTIONS.map((e) => (
                  <button
                    key={e}
                    onClick={() => sendReaction(e)}
                    className="text-2xl hover:scale-125 transition-transform p-1"
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onKeyDown={(e) => e.key === "Enter" && sendReply()}
                  placeholder={`Répondre à ${group.name}...`}
                  className="flex-1 bg-white/15 backdrop-blur text-white placeholder:text-white/60 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:bg-white/25"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="p-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {isPaused && !showViewers && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="p-4 rounded-full bg-black/40 animate-fade-in">
              <Pause className="w-10 h-10 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Viewers sheet */}
      {showViewers && isOwner && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl max-h-[60vh] overflow-y-auto animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sticky top-0 bg-card flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4" /> {viewers.length} {viewers.length > 1 ? "personnes ont vu" : "personne a vu"}
            </h3>
            <button onClick={() => { setShowViewers(false); setIsPaused(false); }} className="p-1.5 rounded-full hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-2">
            {viewers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Aucune vue pour le moment</p>
            ) : (
              viewers.map((v) => (
                <div key={v.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={v.avatar} />
                    <AvatarFallback>{v.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{v.name}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryViewer;
