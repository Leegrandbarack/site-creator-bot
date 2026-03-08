import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import CreatePost from "./CreatePost";
import PostCard from "./PostCard";
import StoriesBar from "./StoriesBar";

interface NewsFeedProps {
  user: { name: string; firstName: string; avatar: string };
}

interface Post {
  id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
}

const NewsFeed = ({ user }: NewsFeedProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { first_name: string | null; last_name: string | null }>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  const fetchPosts = useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPosts(data);

      const authorIds = [...new Set(data.map((p) => p.user_id))];
      if (authorIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name")
          .in("user_id", authorIds);
        if (profileData) {
          const map: Record<string, { first_name: string | null; last_name: string | null }> = {};
          profileData.forEach((p) => { map[p.user_id] = { first_name: p.first_name, last_name: p.last_name }; });
          setProfiles(map);
        }
      }

      if (userId) {
        const { data: likes } = await supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", userId);
        if (likes) {
          setLikedPostIds(new Set(likes.map((l) => l.post_id)));
        }
      }
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchPosts();
  }, [userId, fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handleLikeToggle = (postId: string, liked: boolean) => {
    setLikedPostIds((prev) => {
      const next = new Set(prev);
      liked ? next.add(postId) : next.delete(postId);
      return next;
    });
  };

  if (!userId) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StoriesBar userAvatar={user.avatar} />
      <CreatePost user={user} userId={userId} onPostCreated={fetchPosts} />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-8 text-center">
          <p className="text-muted-foreground text-sm">Aucune publication pour le moment.</p>
          <p className="text-muted-foreground text-sm mt-1">Soyez le premier à publier ! 🚀</p>
        </div>
      ) : (
        posts.map((post, index) => (
          <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
            <PostCard
              post={post}
              currentUserId={userId}
              authorProfile={profiles[post.user_id] || null}
              isLiked={likedPostIds.has(post.id)}
              onLikeToggle={handleLikeToggle}
              onPostDeleted={fetchPosts}
            />
          </div>
        ))
      )}
    </div>
  );
};

export default NewsFeed;
