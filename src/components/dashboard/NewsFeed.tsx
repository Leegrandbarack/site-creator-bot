import { useState } from "react";
import { Image, Video, Smile, ThumbsUp, MessageCircle, Share2, Send } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NewsFeedProps {
  user: { name: string; firstName: string; avatar: string };
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
}

const initialPosts: Post[] = [
  {
    id: 1,
    author: "Marie Dupont",
    avatar: "https://i.pravatar.cc/150?img=5",
    time: "Il y a 2 heures",
    content: "Quelle belle journée ! ☀️ Je profite du soleil avec mes amis au parc. La vie est belle quand on est bien entouré. #bonheur #amis",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=680&h=400&fit=crop",
    likes: 42,
    comments: 8,
    shares: 3,
    liked: false,
  },
  {
    id: 2,
    author: "Jean Martin",
    avatar: "https://i.pravatar.cc/150?img=8",
    time: "Il y a 4 heures",
    content: "Je viens de terminer mon nouveau projet ! 🚀 Tellement fier du résultat. Merci à toute l'équipe pour le soutien.",
    likes: 89,
    comments: 15,
    shares: 7,
    liked: false,
  },
  {
    id: 3,
    author: "Sophie Bernard",
    avatar: "https://i.pravatar.cc/150?img=9",
    time: "Il y a 6 heures",
    content: "Nouveau plat du jour ! 🍝 Qui veut la recette ?",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=680&h=400&fit=crop",
    likes: 156,
    comments: 34,
    shares: 12,
    liked: false,
  },
  {
    id: 4,
    author: "Lucas Petit",
    avatar: "https://i.pravatar.cc/150?img=12",
    time: "Il y a 8 heures",
    content: "La musique adoucit les mœurs 🎵 En concert ce soir à Paris. Qui vient ?",
    likes: 67,
    comments: 22,
    shares: 5,
    liked: false,
  },
];

const NewsFeed = ({ user }: NewsFeedProps) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [newPostText, setNewPostText] = useState("");

  const handlePublish = () => {
    if (!newPostText.trim()) return;
    const newPost: Post = {
      id: Date.now(),
      author: user.name,
      avatar: user.avatar,
      time: "À l'instant",
      content: newPostText,
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
    };
    setPosts([newPost, ...posts]);
    setNewPostText("");
  };

  const toggleLike = (postId: number) => {
    setPosts(posts.map(p =>
      p.id === postId
        ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
        : p
    ));
  };

  return (
    <div className="space-y-4">
      {/* Create Post */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-4">
        <div className="flex gap-3">
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <textarea
            placeholder={`Quoi de neuf, ${user.firstName} ?`}
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[44px]"
            rows={newPostText.length > 80 ? 3 : 1}
          />
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex gap-1">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-destructive">
              <Video className="w-5 h-5" /> Vidéo
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-secondary">
              <Image className="w-5 h-5" /> Photo
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-accent">
              <Smile className="w-5 h-5" /> Humeur
            </button>
          </div>
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={!newPostText.trim()}
            className="rounded-lg px-5"
          >
            <Send className="w-4 h-4 mr-1" /> Publier
          </Button>
        </div>
      </div>

      {/* Posts */}
      {posts.map((post, index) => (
        <article
          key={post.id}
          className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 pb-2">
            <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
              <AvatarImage src={post.avatar} alt={post.author} />
              <AvatarFallback>{post.author[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm text-foreground hover:underline cursor-pointer">{post.author}</p>
              <p className="text-xs text-muted-foreground">{post.time}</p>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 pb-3">
            <p className="text-sm text-foreground leading-relaxed">{post.content}</p>
          </div>

          {/* Image */}
          {post.image && (
            <div className="w-full overflow-hidden">
              <img
                src={post.image}
                alt="Post"
                className="w-full object-cover max-h-[500px] hover:brightness-95 transition-all cursor-pointer"
                loading="lazy"
              />
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <ThumbsUp className="w-3 h-3 text-primary-foreground" />
              </span>
              {post.likes}
            </span>
            <div className="flex gap-3">
              <span>{post.comments} commentaires</span>
              <span>{post.shares} partages</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex border-t border-border mx-4">
            <button
              onClick={() => toggleLike(post.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg my-1 transition-all duration-200 ${
                post.liked
                  ? "text-primary bg-primary/5 hover:bg-primary/10"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <ThumbsUp className={`w-5 h-5 transition-transform duration-300 ${post.liked ? "scale-125 fill-primary" : "hover:scale-110"}`} />
              J'aime
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg my-1 transition-colors">
              <MessageCircle className="w-5 h-5 hover:scale-110 transition-transform" /> Commenter
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg my-1 transition-colors">
              <Share2 className="w-5 h-5 hover:scale-110 transition-transform" /> Partager
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default NewsFeed;
