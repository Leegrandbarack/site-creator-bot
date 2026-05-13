import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ImagePlus, Type, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateStoryDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onCreated: () => void;
}

const GRADIENTS = [
  "linear-gradient(135deg, #667eea, #764ba2)",
  "linear-gradient(135deg, #f093fb, #f5576c)",
  "linear-gradient(135deg, #4facfe, #00f2fe)",
  "linear-gradient(135deg, #43e97b, #38f9d7)",
  "linear-gradient(135deg, #fa709a, #fee140)",
  "linear-gradient(135deg, #30cfd0, #330867)",
];

const CreateStoryDialog = ({ open, onClose, userId, onCreated }: CreateStoryDialogProps) => {
  const [mode, setMode] = useState<"choose" | "image" | "text">("choose");
  const [text, setText] = useState("");
  const [bg, setBg] = useState(GRADIENTS[0]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const reset = () => {
    setMode("choose");
    setText("");
    setBg(GRADIENTS[0]);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handlePick = (f: File) => {
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
    setMode("image");
  };

  const handlePublish = async () => {
    setIsUploading(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType = mode === "image" ? "image" : "text";

      if (mode === "image" && imageFile) {
        const ext = imageFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("stories").upload(path, imageFile);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("stories").getPublicUrl(path);
        mediaUrl = data.publicUrl;
      }

      const { error } = await supabase.from("stories").insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        text_content: text.trim() || null,
        background_color: mode === "text" ? bg : null,
      });
      if (error) throw error;
      toast.success("Story publiée !");
      handleClose();
      onCreated();
    } catch (e) {
      toast.error("Erreur lors de la publication");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une story</DialogTitle>
        </DialogHeader>

        {mode === "choose" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInput.current?.click()}
              className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex flex-col items-center justify-center text-white hover:scale-[1.02] transition-transform shadow-lg"
            >
              <ImagePlus className="w-12 h-12 mb-2" />
              <span className="font-semibold">Photo</span>
            </button>
            <button
              onClick={() => setMode("text")}
              className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex flex-col items-center justify-center text-white hover:scale-[1.02] transition-transform shadow-lg"
            >
              <Type className="w-12 h-12 mb-2" />
              <span className="font-semibold">Texte</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handlePick(e.target.files[0])}
            />
          </div>
        )}

        {mode === "image" && imagePreview && (
          <div className="space-y-3">
            <div className="relative aspect-[9/16] max-h-[60vh] rounded-2xl overflow-hidden bg-black">
              <img src={imagePreview} alt="" className="w-full h-full object-contain" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setMode("choose"); }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ajouter une légende..."
              maxLength={200}
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handlePublish}
              disabled={isUploading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publier la story
            </button>
          </div>
        )}

        {mode === "text" && (
          <div className="space-y-3">
            <div
              className="aspect-[9/16] max-h-[60vh] rounded-2xl flex items-center justify-center p-6 text-white text-center text-2xl font-bold shadow-lg"
              style={{ background: bg }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tapez votre texte..."
                maxLength={150}
                className="w-full h-full bg-transparent text-center resize-none focus:outline-none placeholder:text-white/60"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {GRADIENTS.map((g) => (
                <button
                  key={g}
                  onClick={() => setBg(g)}
                  className={`shrink-0 w-10 h-10 rounded-full border-2 ${bg === g ? "border-primary scale-110" : "border-transparent"} transition-all`}
                  style={{ background: g }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setMode("choose")} className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium">
                Retour
              </button>
              <button
                onClick={handlePublish}
                disabled={isUploading || !text.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
                Publier
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoryDialog;
