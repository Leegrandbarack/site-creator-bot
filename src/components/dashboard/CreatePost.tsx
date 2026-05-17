import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Image as ImageIcon, Smile, Send, X, Loader2, Video, Clapperboard } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmojiPicker from "./EmojiPicker";

interface CreatePostProps {
  user: { name: string; firstName: string; avatar: string };
  userId: string;
  onPostCreated: () => void;
}

const CreatePost = ({ user, userId, onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setExpanded(true);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  const openPhoto = () => {
    setExpanded(true);
    fileInputRef.current?.click();
  };

  const handlePublish = async () => {
    if (!content.trim() && !imageFile) return;
    setIsPublishing(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("post-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim() || null,
        image_url: imageUrl,
      });

      if (error) throw error;

      setContent("");
      removeImage();
      setShowEmoji(false);
      setExpanded(false);
      onPostCreated();
      toast.success("Publication créée !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border">
      {/* Top row : avatar + "Quoi de neuf ?" bubble */}
      <div className="flex items-center gap-3 px-3 sm:px-4 pt-3 pb-2">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.firstName[0]}</AvatarFallback>
        </Avatar>
        {expanded ? (
          <textarea
            ref={textareaRef}
            autoFocus
            placeholder={`Quoi de neuf, ${user.firstName} ?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[44px]"
            rows={content.length > 80 ? 3 : 2}
          />
        ) : (
          <button
            onClick={() => setExpanded(true)}
            className="flex-1 text-left bg-muted hover:bg-muted/80 transition-colors rounded-full px-4 py-2.5 text-[15px] text-muted-foreground"
          >
            Quoi de neuf, {user.firstName} ?
          </button>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mx-3 sm:mx-4 mb-2 rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="Preview" className="w-full max-h-[320px] object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 bg-foreground/70 text-background rounded-full flex items-center justify-center hover:bg-foreground/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji picker */}
      {showEmoji && (
        <div className="px-3 sm:px-4 pb-2">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* Action row (Facebook style) */}
      <div className="border-t border-border grid grid-cols-3 divide-x divide-border">
        <button
          onClick={() => { setExpanded(true); toast.info("Direct bientôt disponible"); }}
          className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted transition-colors"
        >
          <Video className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-foreground">Direct</span>
        </button>
        <button
          onClick={openPhoto}
          className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted transition-colors"
        >
          <ImageIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm font-medium text-foreground">Photo</span>
        </button>
        <button
          onClick={() => toast.info("Reels bientôt disponible")}
          className="flex items-center justify-center gap-2 py-2.5 hover:bg-muted transition-colors"
        >
          <Clapperboard className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-foreground">Reels</span>
        </button>
      </div>

      {/* Publish bar (only when expanded) */}
      {expanded && (
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-t border-border">
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors ${showEmoji ? "bg-muted text-primary" : "text-accent"}`}
          >
            <Smile className="w-5 h-5" /> Emoji
          </button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setExpanded(false); removeImage(); setContent(""); setShowEmoji(false); }}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={(!content.trim() && !imageFile) || isPublishing}
              className="rounded-lg px-5"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Publier
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
