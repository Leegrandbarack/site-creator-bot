import { useState, useEffect, useCallback } from "react";
import { Heart, MessageCircle, Share2, Send, Loader2, Reply, ChevronDown, ChevronUp } from "lucide-react";
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
  authorProfile: { first_name: string | null; last_name: string | null } | null;
  isLiked: boolean;
  onLikeToggle: (postId: string, liked: boolean) => void;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_comment_id: string | null;
  likes_count: number;
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [commentLikeAnimating, setCommentLikeAnimating] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const authorName = authorProfile
    ? `${authorProfile.first_name || ""} ${authorProfile.last_name || ""}`.trim() || "Utilisateur"
    : "Utilisateur";
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

  const loadComments = useCallback(async () => {
    setIsLoadingComments(true);
    const { data } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })
      .limit(100);
    setComments(data || []);

    // Load liked comment IDs
    if (data && data.length > 0) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", currentUserId)
        .in("comment_id", data.map((c) => c.id));
      if (likes) setLikedCommentIds(new Set(likes.map((l) => l.comment_id)));
    }
    setIsLoadingComments(false);
  }, [post.id, currentUserId]);

  const toggleComments = () => {
    const newState = !showComments;
    setShowComments(newState);
    if (newState && comments.length === 0) loadComments();
  };

  // Realtime comments
  useEffect(() => {
    if (!showComments) return;
    const channel = supabase
      .channel(`comments-${post.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${post.id}` }, () => {
        loadComments();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [showComments, post.id, loadComments]);

  const sendComment = async () => {
    if (!newComment.trim()) return;
    setIsSendingComment(true);
    try {
      const insertData: any = {
        post_id: post.id,
        user_id: currentUserId,
        content: newComment.trim(),
      };
      if (replyingTo) insertData.parent_comment_id = replyingTo.id;

      const { error } = await supabase.from("post_comments").insert(insertData);
      if (error) throw error;
      setNewComment("");
      setReplyingTo(null);
      setCommentsCount((c) => c + 1);
      if (replyingTo) setExpandedReplies((prev) => new Set(prev).add(replyingTo.id));
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    setCommentLikeAnimating(commentId);
    setTimeout(() => setCommentLikeAnimating(null), 500);

    const wasLiked = likedCommentIds.has(commentId);
    setLikedCommentIds((prev) => {
      const next = new Set(prev);
      wasLiked ? next.delete(commentId) : next.add(commentId);
      return next;
    });
    setComments((prev) =>
      prev.map((c) => c.id === commentId ? { ...c, likes_count: c.likes_count + (wasLiked ? -1 : 1) } : c)
    );

    try {
      if (wasLiked) {
        await supabase.from("comment_likes").delete().eq("comment_id", commentId).eq("user_id", currentUserId);
      } else {
        await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: currentUserId });
      }
    } catch {
      // revert
      setLikedCommentIds((prev) => {
        const next = new Set(prev);
        wasLiked ? next.add(commentId) : next.delete(commentId);
        return next;
      });
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, likes_count: c.likes_count + (wasLiked ? 1 : -1) } : c)
      );
    }
  };

  const topLevelComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_comment_id === parentId);

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(commentId) ? next.delete(commentId) : next.add(commentId);
      return next;
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const isCommentLiked = likedCommentIds.has(comment.id);
    const replies = getReplies(comment.id);
    const isExpanded = expandedReplies.has(comment.id);
    const commentName = "Utilisateur";
    const commentTime = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: fr });

    return (
      <div className={`animate-fade-in ${isReply ? "ml-10" : ""}`} style={{ animationDuration: "0.25s" }}>
        <div className="flex gap-2 group">
          <Avatar className={`${isReply ? "w-7 h-7" : "w-8 h-8"} shrink-0`}>
            <AvatarImage src={`https://i.pravatar.cc/150?u=${comment.user_id}`} />
            <AvatarFallback className="text-xs">U</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="bg-muted rounded-2xl px-3 py-2 inline-block max-w-full">
              <p className="font-semibold text-xs text-foreground">{commentName}</p>
              <p className="text-sm text-foreground break-words">{comment.content}</p>
            </div>
            {/* Comment actions */}
            <div className="flex items-center gap-3 mt-0.5 ml-2 text-xs">
              <span className="text-muted-foreground">{commentTime}</span>
              <button
                onClick={() => handleCommentLike(comment.id)}
                className={`font-semibold transition-colors ${isCommentLiked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                <span className="flex items-center gap-1">
                  <Heart
                    className={`w-3 h-3 transition-all duration-300 ${isCommentLiked ? "fill-primary text-primary" : ""} ${commentLikeAnimating === comment.id ? "scale-150" : ""}`}
                  />
                  {comment.likes_count > 0 && comment.likes_count}
                </span>
              </button>
              {!isReply && (
                <button
                  onClick={() => {
                    setReplyingTo({ id: comment.id, name: commentName });
                    setExpandedReplies((prev) => new Set(prev).add(comment.id));
                  }}
                  className="font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                >
                  <Reply className="w-3 h-3" /> Répondre
                </button>
              )}
            </div>

            {/* Replies toggle */}
            {!isReply && replies.length > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="flex items-center gap-1 ml-2 mt-1 text-xs font-semibold text-primary hover:underline"
              >
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {replies.length} réponse{replies.length > 1 ? "s" : ""}
              </button>
            )}

            {/* Replies */}
            {!isReply && isExpanded && replies.length > 0 && (
              <div className="mt-2 space-y-2">
                {replies.map((reply) => (
                  <CommentItem key={reply.id} comment={reply} isReply />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <article className="bg-card rounded-xl shadow-sm border border-border overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-2">
        <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
          <AvatarImage src={avatarUrl} alt={authorName} />
          <AvatarFallback>{authorName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm text-foreground hover:underline cursor-pointer">{authorName}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>
      )}

      {post.image_url && (
        <div className="w-full overflow-hidden">
          <img src={post.image_url} alt="Post" className="w-full object-cover max-h-[500px] hover:brightness-95 transition-all cursor-pointer" loading="lazy" />
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
          <button onClick={toggleComments} className="hover:underline">{commentsCount} commentaires</button>
          <span>{post.shares_count} partages</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex border-t border-border mx-4">
        <button onClick={handleLike} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg my-1 transition-all duration-200 ${liked ? "text-primary bg-primary/5 hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}>
          <Heart className={`w-5 h-5 transition-all duration-300 ${liked ? "fill-primary text-primary" : ""} ${likeAnimating ? "scale-150" : "hover:scale-110"}`} />
          J'aime
        </button>
        <button onClick={toggleComments} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg my-1 transition-colors">
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
            <div className="flex justify-center py-3"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {topLevelComments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
              ))}
              {topLevelComments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Soyez le premier à commenter 💬</p>
              )}
            </div>
          )}

          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex items-center gap-2 mt-2 px-2 py-1 bg-muted/50 rounded-lg text-xs text-muted-foreground animate-fade-in">
              <Reply className="w-3 h-3" />
              Réponse à <span className="font-semibold text-foreground">{replyingTo.name}</span>
              <button onClick={() => setReplyingTo(null)} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
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
                placeholder={replyingTo ? `Répondre à ${replyingTo.name}...` : "Écrire un commentaire..."}
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
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
