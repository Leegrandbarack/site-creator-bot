import { useState, useRef } from "react";
import { Image, Video, Smile, Send, X, Loader2 } from "lucide-react";
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
    <div className="bg-card rounded-xl shadow-sm border border-border p-4">
      <div className="flex gap-3">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <textarea
          ref={textareaRef}
          placeholder={`Quoi de neuf, ${user.firstName} ?`}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="flex-1 resize-none bg-muted rounded-xl px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all min-h-[44px]"
          rows={content.length > 80 ? 3 : 1}
        />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="relative mt-3 rounded-xl overflow-hidden border border-border">
          <img src={imagePreview} alt="Preview" className="w-full max-h-[300px] object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 w-8 h-8 bg-foreground/70 text-background rounded-full flex items-center justify-center hover:bg-foreground/90 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmoji && (
        <div className="mt-3">
          <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmoji(false)} />
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
        <div className="flex gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-secondary"
          >
            <Image className="w-5 h-5" /> Photo
          </button>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors ${showEmoji ? "bg-muted text-primary" : "text-accent"}`}
          >
            <Smile className="w-5 h-5" /> Emoji
          </button>
        </div>
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
  );
};

export default CreatePost;
