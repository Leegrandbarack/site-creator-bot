import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image as ImageIcon, Users } from "lucide-react";
import PostCard from "@/components/dashboard/PostCard";

interface ProfileTabsProps {
  profileUserId: string;
  currentUserId: string;
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

const tabs = [
  { id: "posts", label: "Publications" },
  { id: "photos", label: "Photos" },
  { id: "friends", label: "Amis" },
];

const demoFriends = [
  { name: "Marie Dupont", avatar: "https://i.pravatar.cc/150?img=5", mutual: 12 },
  { name: "Jean Martin", avatar: "https://i.pravatar.cc/150?img=8", mutual: 8 },
  { name: "Sophie Bernard", avatar: "https://i.pravatar.cc/150?img=9", mutual: 5 },
  { name: "Lucas Petit", avatar: "https://i.pravatar.cc/150?img=12", mutual: 15 },
  { name: "Amina K.", avatar: "https://i.pravatar.cc/150?img=1", mutual: 3 },
  { name: "Paul D.", avatar: "https://i.pravatar.cc/150?img=4", mutual: 7 },
];

const ProfileTabs = ({ profileUserId, currentUserId }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", profileUserId)
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts(data || []);

    if (data && data.length > 0) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", currentUserId)
        .in("post_id", data.map((p) => p.id));
      if (likes) setLikedPostIds(new Set(likes.map((l) => l.post_id)));
    }
    setIsLoading(false);
  }, [profileUserId, currentUserId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const photoPosts = posts.filter((p) => p.image_url);

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-border mt-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3.5 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full animate-scale-in" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === "posts" && (
          <div className="max-w-[680px] mx-auto space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : posts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center">
                <p className="text-muted-foreground text-sm">Aucune publication pour le moment.</p>
              </div>
            ) : (
              posts.map((post, i) => (
                <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                  <PostCard
                    post={post}
                    currentUserId={currentUserId}
                    authorProfile={null}
                    isLiked={likedPostIds.has(post.id)}
                    onLikeToggle={(id, liked) => {
                      setLikedPostIds((prev) => {
                        const next = new Set(prev);
                        liked ? next.add(id) : next.delete(id);
                        return next;
                      });
                    }}
                  />
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "photos" && (
          <div>
            {photoPosts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune photo pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photoPosts.map((post, i) => (
                  <div
                    key={post.id}
                    className="aspect-square rounded-xl overflow-hidden group cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <img
                      src={post.image_url!}
                      alt="Photo"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {demoFriends.map((friend, i) => (
              <div
                key={friend.name}
                className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <img src={friend.avatar} alt={friend.name} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <p className="font-semibold text-sm text-foreground hover:underline">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">{friend.mutual} amis en commun</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTabs;
