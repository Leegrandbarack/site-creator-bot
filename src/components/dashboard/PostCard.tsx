import { useState } from "react";
import { ThumbsUp, MessageCircle, Share2, Heart, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string | null;
    image_url: string | null;
    likes_count: number;
    comments_count: number;
    shares_count: number;
    created_at: string;
  };
  currentUserId: string;
  authorProfile: { first_name: string | null; last_name: string | null; avatar?: string } | null;
  isLiked: boolean;
  onLikeToggle: (postId: string, liked: boolean) => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
}

const PostCard = ({ post, currentUserId, authorProfile, isLiked, onLikeToggle }: PostCardProps) => {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);

  const authorName = authorProfile
    ? `${authorProfile.first_name || ""} ${authorProfile.last_name || ""}`.trim() || "Utilisateur"
    : "Utilisateur";
  const authorInitial = authorName[0];
  const avatarUrl = `https://i.pravatar.cc/150?u=${post.user_id}`;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr });

  const handleLike = async () => {
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 600);

    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c) => (wasLiked ? c - 1 : c + 1));

    try {
      if (wasLiked) {
        await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
      }
      onLikeToggle(post.id, !wasLiked);
    } catch {
      setLiked(wasLiked);
      setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(50);
    setComments(data || []);
    setIsLoadingComments(false);
  };

  const toggleComments = () => {
    const newState = !showComments;
    setShowComments(newState);
    if (newState && comments.length === 0) loadComments();
  };

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setIsSendingComment(true);
    try {
      const { error } = await supabase.from("post_comments").insert({
        post_id: post.id,
        user_id: currentUserId,
        content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment("");
      setCommentsCount((c) => c + 1);
      loadComments();
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setIsSendingComment(false);
    }
  };

  return (
    <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <AvatarImage src={avatarUrl} alt={authorName} />
          <AvatarFallback>{authorInitial}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground hover:underline cursor-pointer">{authorName}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {/* Image */}
      {post.image_url && (
        <div className="w-full overflow-hidden">
          <img
            src={post.image_url}
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
            <Heart className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
          </span>
          {likesCount}
        </span>
        <div className="flex gap-3">
          <button onClick={toggleComments} className="hover:underline">
            {commentsCount} commentaires
          </button>
          <span>{post.shares_count} partages</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-border mx-4">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg my-1 transition-all duration-200 ${
            liked ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <Heart
            className={`w-5 h-5 transition-all duration-300 ${
              liked ? "fill-primary text-primary" : ""
            } ${likeAnimating ? "scale-150" : "hover:scale-110"}`}
          />
          J'aime
        </button>
        <button
          onClick={toggleComments}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg my-1 transition-colors"
        >
          <MessageCircle className="w-5 h-5 hover:scale-110 transition-transform" /> Commenter
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg my-1 transition-colors">
          <Share2 className="w-5 h-5 hover:scale-110 transition-transform" /> Partager
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-border px-4 py-3 animate-fade-in">
          {isLoadingComments ? (
            <div className="flex justify-center py-3">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 animate-fade-in">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${comment.user_id}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-2xl px-3 py-2 text-sm">
                    <p className="font-semibold text-xs text-foreground">Utilisateur</p>
                    <p className="text-foreground">{comment.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Aucun commentaire</p>
              )}
            </div>
          )}

          {/* New Comment Input */}
          <div className="flex gap-2 mt-3">
            <Avatar className="w-8 h-8 shrink-0">
              <AvatarImage src={`https://i.pravatar.cc/150?u=${currentUserId}`} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-1">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendComment()}
                placeholder="Écrire un commentaire..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={sendComment}
                disabled={!newComment.trim() || isSendingComment}
                className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-40 hover:bg-primary/90 transition-colors shrink-0"
              >
                {isSendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
