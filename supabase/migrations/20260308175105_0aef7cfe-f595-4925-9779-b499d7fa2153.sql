
-- Add parent_comment_id for replies
ALTER TABLE public.post_comments ADD COLUMN parent_comment_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE;

-- Comment likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes" ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comment likes" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add likes_count to comments
ALTER TABLE public.post_comments ADD COLUMN likes_count INTEGER NOT NULL DEFAULT 0;

-- Trigger for comment likes count
CREATE OR REPLACE FUNCTION public.update_comment_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_comment_like_change
AFTER INSERT OR DELETE ON public.comment_likes
FOR EACH ROW EXECUTE FUNCTION public.update_comment_likes_count();

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
