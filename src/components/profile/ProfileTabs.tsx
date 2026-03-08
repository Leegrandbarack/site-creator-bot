import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image as ImageIcon, Users, UserX } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

interface Friend {
  userId: string;
  name: string;
  avatar: string;
}

const tabs = [
  { id: "posts", label: "Publications" },
  { id: "photos", label: "Photos" },
  { id: "friends", label: "Amis" },
];

const ProfileTabs = ({ profileUserId, currentUserId }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const navigate = useNavigate();

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

  const fetchFriends = useCallback(async () => {
    setIsLoadingFriends(true);
    const { data } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${profileUserId},addressee_id.eq.${profileUserId}`);

    if (data) {
      const friendList: Friend[] = data.map((f) => {
        const friendId = f.requester_id === profileUserId ? f.addressee_id : f.requester_id;
        return {
          userId: friendId,
          name: "Utilisateur",
          avatar: `https://i.pravatar.cc/150?u=${friendId}`,
        };
      });
      setFriends(friendList);
    }
    setIsLoadingFriends(false);
  }, [profileUserId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (activeTab === "friends") fetchFriends();
  }, [activeTab, fetchFriends]);

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
              activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full animate-scale-in" />
            )}
          </button>
        ))}
      </div>

      <div className="animate-fade-in">
        {/* Posts Tab */}
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

        {/* Photos Tab */}
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
                    <img src={post.image_url!} alt="Photo" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div>
            {isLoadingFriends ? (
              <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : friends.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucun ami pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {friends.map((friend, i) => (
                  <div
                    key={friend.userId}
                    onClick={() => navigate(`/profile/${friend.userId}`)}
                    className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:shadow-md transition-all duration-200 cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={friend.avatar} alt={friend.name} />
                      <AvatarFallback>{friend.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground hover:underline">{friend.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTabs;
