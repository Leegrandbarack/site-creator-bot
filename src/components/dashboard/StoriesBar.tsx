import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import StoryViewer, { StoryItem } from "./StoryViewer";
import CreateStoryDialog from "./CreateStoryDialog";

interface StoriesBarProps {
  userAvatar: string;
}

interface GroupedStory {
  user_id: string;
  name: string;
  avatar: string;
  stories: StoryItem[];
  hasUnseen: boolean;
}

const StoriesBar = ({ userAvatar }: StoriesBarProps) => {
  const [groups, setGroups] = useState<GroupedStory[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const load = useCallback(async () => {
    if (!userId) return;
    const { data: stories } = await supabase
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    if (!stories) return;

    const userIds = [...new Set(stories.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url")
      .in("user_id", userIds);

    const { data: views } = await supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", userId);
    const seenIds = new Set((views || []).map((v) => v.story_id));

    const map = new Map<string, GroupedStory>();
    for (const s of stories) {
      const profile = profiles?.find((p) => p.user_id === s.user_id);
      const name = profile
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Utilisateur"
        : "Utilisateur";
      const avatar = profile?.avatar_url || `https://i.pravatar.cc/150?u=${s.user_id}`;
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { user_id: s.user_id, name, avatar, stories: [], hasUnseen: false });
      }
      const g = map.get(s.user_id)!;
      g.stories.push(s as StoryItem);
      if (!seenIds.has(s.id)) g.hasUnseen = true;
    }
    // Current user first
    const arr = Array.from(map.values()).sort((a, b) => {
      if (a.user_id === userId) return -1;
      if (b.user_id === userId) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return 0;
    });
    setGroups(arr);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel("stories-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, load]);

  const handleViewerClose = () => {
    setViewerIndex(null);
    load();
  };

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-2 px-1 scrollbar-hide snap-x snap-mandatory">
        <button
          onClick={() => setCreateOpen(true)}
          className="relative shrink-0 w-[110px] h-[200px] rounded-2xl overflow-hidden bg-card border border-border shadow-sm group snap-start hover:shadow-md transition-shadow"
        >
          {userAvatar ? (
            <img src={userAvatar} alt="Créer" className="w-full h-[70%] object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-[70%] bg-gradient-to-br from-primary/30 to-primary/10" />
          )}
          <div className="absolute bottom-0 inset-x-0 h-[30%] bg-card flex flex-col items-center justify-end pb-2">
            <div className="absolute top-0 -translate-y-1/2 w-9 h-9 bg-primary rounded-full flex items-center justify-center border-4 border-card shadow">
              <Plus className="w-5 h-5 text-primary-foreground" strokeWidth={3} />
            </div>
            <span className="text-[13px] font-semibold text-foreground">Créer une story</span>
          </div>
        </button>

        {groups.map((g, i) => {
          const cover = g.stories[0];
          const coverBg = cover.media_url
            ? undefined
            : cover.background_color || "linear-gradient(135deg,#667eea,#764ba2)";
          return (
            <button
              key={g.user_id}
              onClick={() => setViewerIndex(i)}
              className="relative shrink-0 w-[110px] h-[200px] rounded-2xl overflow-hidden group cursor-pointer snap-start animate-fade-in shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {cover.media_url ? (
                <img src={cover.media_url} alt={g.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2 text-white text-xs font-bold text-center" style={{ background: coverBg }}>
                  {cover.text_content?.slice(0, 50) || g.name}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className={`absolute top-2.5 left-2.5 p-[3px] rounded-full ${g.hasUnseen ? "bg-gradient-to-tr from-pink-500 via-primary to-blue-500" : "bg-muted"}`}>
                <Avatar className="w-9 h-9 border-[3px] border-card">
                  <AvatarImage src={g.avatar} />
                  <AvatarFallback className="text-xs">{g.name[0]}</AvatarFallback>
                </Avatar>
              </div>
              <span className="absolute bottom-2 left-2 right-2 text-[13px] font-semibold text-white truncate drop-shadow">
                {g.user_id === userId ? "Votre story" : g.name}
              </span>
            </button>
          );
        })}
      </div>

      {viewerIndex !== null && userId && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={viewerIndex}
          currentUserId={userId}
          onClose={handleViewerClose}
        />
      )}

      {userId && (
        <CreateStoryDialog open={createOpen} onClose={() => setCreateOpen(false)} userId={userId} onCreated={load} />
      )}
    </>
  );
};

export default StoriesBar;
