import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image as ImageIcon, Users, MapPin, Briefcase, GraduationCap, CalendarDays, Heart, X, Mail, Phone, Plus, ChevronDown } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PostCard from "@/components/dashboard/PostCard";
import StoryViewer from "@/components/dashboard/StoryViewer";

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
  { id: "about", label: "À propos" },
  { id: "friends", label: "Amis" },
  { id: "photos", label: "Photos" },
  { id: "stories", label: "Stories" },
];

// Mock stories for profile (will be dynamic later)
const mockStories = [
  { name: "Vacances", avatar: "https://i.pravatar.cc/150?img=5", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Travail", avatar: "https://i.pravatar.cc/150?img=8", image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=1000&fit=crop", hasNew: true },
  { name: "Soirée", avatar: "https://i.pravatar.cc/150?img=1", image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=1000&fit=crop", hasNew: false },
  { name: "Sport", avatar: "https://i.pravatar.cc/150?img=4", image: "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=600&h=1000&fit=crop", hasNew: true },
];

const ProfileTabs = ({ profileUserId, currentUserId }: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();

  const isOwnProfile = profileUserId === currentUserId;

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

    if (data && data.length > 0) {
      const friendIds = data.map((f) =>
        f.requester_id === profileUserId ? f.addressee_id : f.requester_id
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name, avatar_url")
        .in("user_id", friendIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const friendList: Friend[] = friendIds.map((id) => {
        const p = profileMap.get(id);
        return {
          userId: id,
          name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") || "Utilisateur" : "Utilisateur",
          avatar: p?.avatar_url || `https://i.pravatar.cc/150?u=${id}`,
        };
      });
      setFriends(friendList);
    } else {
      setFriends([]);
    }
    setIsLoadingFriends(false);
  }, [profileUserId]);

  useEffect(() => {
    const fetchProfileInfo = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", profileUserId)
        .maybeSingle();
      setProfileInfo(data);
    };
    fetchProfileInfo();
    fetchPosts();
  }, [profileUserId, fetchPosts]);

  useEffect(() => {
    if (activeTab === "friends") fetchFriends();
  }, [activeTab, fetchFriends]);

  const photoPosts = posts.filter((p) => p.image_url);

  return (
    <div>
      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-border mt-2 mb-4 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-3.5 text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full animate-scale-in" />
            )}
          </button>
        ))}
        {/* More dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="relative px-5 py-3.5 text-sm font-semibold text-muted-foreground hover:bg-muted whitespace-nowrap flex items-center gap-1"
          >
            Plus <ChevronDown className="w-3 h-3" />
          </button>
          {showMoreMenu && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg py-1 z-50 min-w-[160px] animate-fade-in">
              {["Vidéos", "Check-ins", "Événements"].map((item) => (
                <button
                  key={item}
                  onClick={() => setShowMoreMenu(false)}
                  className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="animate-fade-in">
        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
            {/* Left: Intro Card */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <h3 className="font-bold text-foreground mb-3">Intro</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  {profileInfo?.bio && (
                    <p className="text-foreground text-center">{profileInfo.bio}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Habite à <strong className="text-foreground">Paris, France</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Développeur chez <strong className="text-foreground">TechCorp</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>A étudié à <strong className="text-foreground">Université Paris</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 shrink-0" />
                    <span>Célibataire</span>
                  </div>
                  {profileInfo?.birth_date && (
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span>Né(e) le {new Date(profileInfo.birth_date).toLocaleDateString("fr-FR")}</span>
                    </div>
                  )}
                  {isOwnProfile && (
                    <Button variant="secondary" className="w-full mt-2 rounded-lg" onClick={() => navigate("/settings")}>
                      Modifier les détails
                    </Button>
                  )}
                </div>
              </div>

              {/* Photos preview card */}
              {photoPosts.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground">Photos</h3>
                    <button onClick={() => setActiveTab("photos")} className="text-sm text-primary hover:underline">
                      Tout voir
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {photoPosts.slice(0, 9).map((post) => (
                      <div
                        key={post.id}
                        onClick={() => setLightboxUrl(post.image_url)}
                        className="aspect-square rounded-lg overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={post.image_url!}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends preview card */}
              <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground">Amis</h3>
                  <button onClick={() => setActiveTab("friends")} className="text-sm text-primary hover:underline">
                    Tout voir
                  </button>
                </div>
                {friends.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {friends.slice(0, 6).map((f) => (
                      <div
                        key={f.userId}
                        onClick={() => navigate(`/profile/${f.userId}`)}
                        className="text-center cursor-pointer group"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden mb-1">
                          <img
                            src={f.avatar}
                            alt={f.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">Aucun ami</p>
                )}
              </div>
            </div>

            {/* Right: Posts */}
            <div className="space-y-4">
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
          </div>
        )}

        {/* About Tab */}
        {activeTab === "about" && (
          <div className="max-w-[680px] mx-auto bg-card rounded-xl border border-border p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">À propos</h2>
              {isOwnProfile && (
                <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate("/settings")}>
                  Modifier
                </Button>
              )}
            </div>

            {profileInfo?.bio && (
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-foreground text-center italic">"{profileInfo.bio}"</p>
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide">Informations personnelles</h3>
              
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Ville actuelle</p>
                  <p className="text-sm text-muted-foreground">Paris, France</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Travail</p>
                  <p className="text-sm text-muted-foreground">Développeur chez TechCorp</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <GraduationCap className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Formation</p>
                  <p className="text-sm text-muted-foreground">Université Paris</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Heart className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Situation amoureuse</p>
                  <p className="text-sm text-muted-foreground">Célibataire</p>
                </div>
              </div>
              {profileInfo?.birth_date && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <CalendarDays className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Date de naissance</p>
                    <p className="text-sm text-muted-foreground">{new Date(profileInfo.birth_date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              )}

              <h3 className="text-sm font-semibold text-foreground mb-2 uppercase tracking-wide pt-4">Contact</h3>
              
              {profileInfo?.email && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{profileInfo.email}</p>
                  </div>
                </div>
              )}
              {profileInfo?.phone && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Téléphone</p>
                    <p className="text-sm text-muted-foreground">{profileInfo.phone}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stories Tab */}
        {activeTab === "stories" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Stories</h2>
              {isOwnProfile && (
                <Button className="rounded-lg gap-2">
                  <Plus className="w-4 h-4" /> Ajouter une story
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {mockStories.map((story, i) => (
                <button
                  key={i}
                  onClick={() => setStoryViewerIndex(i)}
                  className="relative aspect-[9/16] max-h-[320px] rounded-xl overflow-hidden group cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white truncate">
                    {story.name}
                  </span>
                  {story.hasNew && (
                    <div className="absolute top-3 left-3 w-3 h-3 bg-primary rounded-full border-2 border-card" />
                  )}
                </button>
              ))}
            </div>

            {storyViewerIndex !== null && (
              <StoryViewer
                stories={mockStories}
                initialIndex={storyViewerIndex}
                onClose={() => setStoryViewerIndex(null)}
              />
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div>
            <div className="flex gap-2 mb-4">
              {["Toutes les photos", "Albums", "Photos taguées"].map((filter, i) => (
                <Button
                  key={filter}
                  variant={i === 0 ? "default" : "outline"}
                  size="sm"
                  className="rounded-lg"
                >
                  {filter}
                </Button>
              ))}
            </div>
            {photoPosts.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Aucune photo pour le moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {photoPosts.map((post, i) => (
                  <div
                    key={post.id}
                    onClick={() => setLightboxUrl(post.image_url)}
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

      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-fade-in cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxUrl}
            alt="Photo agrandie"
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProfileTabs;
