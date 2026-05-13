import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Repeat2, BookImage, Send, Link2, Loader2, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  postContent: string | null;
  postImage: string | null;
  authorName: string;
  currentUserId: string;
  onShared?: () => void;
}

type ShareMode = "menu" | "repost" | "message";

const ShareDialog = ({ open, onClose, postId, postContent, postImage, authorName, currentUserId, onShared }: ShareDialogProps) => {
  const [mode, setMode] = useState<ShareMode>("menu");
  const [comment, setComment] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [friends, setFriends] = useState<{ user_id: string; first_name: string | null; last_name: string | null }[]>([]);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) {
      setMode("menu");
      setComment("");
      setLinkCopied(false);
      setSentTo(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (mode !== "message") return;
    (async () => {
      const { data: friendships } = await supabase
        .from("friendships")
        .select("requester_id, addressee_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);
      const friendIds = (friendships || []).map((f) =>
        f.requester_id === currentUserId ? f.addressee_id : f.requester_id
      );
      if (friendIds.length === 0) return setFriends([]);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", friendIds);
      setFriends(profiles || []);
    })();
  }, [mode, currentUserId]);

  const recordShare = async (shareType: string, withComment?: string) => {
    await supabase.from("post_shares").insert({
      post_id: postId,
      user_id: currentUserId,
      share_type: shareType,
      comment: withComment || null,
    });
    onShared?.();
  };

  const handleRepost = async () => {
    setIsSharing(true);
    try {
      const sharedContent = comment.trim()
        ? `${comment.trim()}\n\n— Repartagé depuis ${authorName} —\n${postContent || ""}`
        : `Repartagé depuis ${authorName}\n${postContent || ""}`;
      const { error } = await supabase.from("posts").insert({
        user_id: currentUserId,
        content: sharedContent,
        image_url: postImage,
      });
      if (error) throw error;
      await recordShare("repost", comment.trim() || undefined);
      toast.success("Publication repartagée sur votre profil");
      onClose();
    } catch {
      toast.error("Erreur lors du partage");
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareToStory = async () => {
    setIsSharing(true);
    try {
      const { error } = await supabase.from("stories").insert({
        user_id: currentUserId,
        media_url: postImage,
        media_type: postImage ? "image" : "text",
        text_content: postContent || `Publication de ${authorName}`,
        background_color: "linear-gradient(135deg, hsl(var(--primary)), hsl(220 70% 50%))",
      });
      if (error) throw error;
      await recordShare("story");
      toast.success("Ajouté à votre story");
      onClose();
    } catch {
      toast.error("Erreur lors du partage en story");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/dashboard?post=${postId}`;
    await navigator.clipboard.writeText(url);
    setLinkCopied(true);
    await recordShare("link");
    toast.success("Lien copié");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const sendToFriend = async (friendId: string) => {
    try {
      // Find or create conversation
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
          .eq("user_id", friendId)
          .in("conversation_id", myConvIds);
        if (shared && shared.length > 0) convId = shared[0].conversation_id;
      }
      if (!convId) {
        const { data, error } = await supabase.rpc("create_conversation_with_participant", {
          other_user_id: friendId,
        });
        if (error) throw error;
        convId = data as string;
      }
      const link = `${window.location.origin}/dashboard?post=${postId}`;
      const text = comment.trim()
        ? `${comment.trim()}\n${link}`
        : `📎 Publication partagée : ${link}`;
      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: text,
      });
      await recordShare("message");
      setSentTo((prev) => new Set(prev).add(friendId));
      toast.success("Envoyé");
    } catch {
      toast.error("Erreur lors de l'envoi");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "menu" && "Partager"}
            {mode === "repost" && "Repartager sur votre profil"}
            {mode === "message" && "Envoyer à un ami"}
          </DialogTitle>
        </DialogHeader>

        {mode === "menu" && (
          <div className="space-y-2">
            <button
              onClick={() => setMode("repost")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Repeat2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Repartager sur votre profil</p>
                <p className="text-xs text-muted-foreground">Ajouter un commentaire optionnel</p>
              </div>
            </button>
            <button
              onClick={handleShareToStory}
              disabled={isSharing}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BookImage className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Partager dans une story</p>
                <p className="text-xs text-muted-foreground">Visible 24 heures</p>
              </div>
            </button>
            <button
              onClick={() => setMode("message")}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Envoyer en message privé</p>
                <p className="text-xs text-muted-foreground">À un ou plusieurs amis</p>
              </div>
            </button>
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {linkCopied ? <Check className="w-5 h-5 text-primary" /> : <Link2 className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <p className="font-semibold text-sm">{linkCopied ? "Lien copié !" : "Copier le lien"}</p>
                <p className="text-xs text-muted-foreground">Partager partout</p>
              </div>
            </button>
          </div>
        )}

        {mode === "repost" && (
          <div className="space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ajoutez un commentaire (optionnel)..."
              className="w-full bg-muted rounded-xl px-4 py-3 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={500}
            />
            <div className="bg-muted/50 rounded-xl p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Publication originale de {authorName}</p>
              {postContent && <p className="text-sm line-clamp-3">{postContent}</p>}
              {postImage && <img src={postImage} alt="" className="mt-2 rounded-lg max-h-32 object-cover w-full" />}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setMode("menu")} className="px-4 py-2 text-sm rounded-lg hover:bg-muted">
                Retour
              </button>
              <button
                onClick={handleRepost}
                disabled={isSharing}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center gap-2"
              >
                {isSharing && <Loader2 className="w-4 h-4 animate-spin" />}
                Repartager
              </button>
            </div>
          </div>
        )}

        {mode === "message" && (
          <div className="space-y-3">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Message (optionnel)..."
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucun ami à qui envoyer</p>
              ) : (
                friends.map((f) => {
                  const name = `${f.first_name || ""} ${f.last_name || ""}`.trim() || "Utilisateur";
                  const sent = sentTo.has(f.user_id);
                  return (
                    <div key={f.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={`https://i.pravatar.cc/150?u=${f.user_id}`} />
                        <AvatarFallback>{name[0]}</AvatarFallback>
                      </Avatar>
                      <p className="flex-1 text-sm font-medium truncate">{name}</p>
                      <button
                        onClick={() => sendToFriend(f.user_id)}
                        disabled={sent}
                        className={`px-3 py-1.5 text-xs rounded-full font-semibold transition-colors ${
                          sent ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground hover:bg-primary/90"
                        }`}
                      >
                        {sent ? "Envoyé ✓" : "Envoyer"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={() => setMode("menu")} className="text-sm text-muted-foreground hover:text-foreground">
              ← Retour
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
