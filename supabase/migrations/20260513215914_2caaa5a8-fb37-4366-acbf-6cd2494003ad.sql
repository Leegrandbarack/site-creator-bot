
-- Storage bucket for stories
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Stories images publicly readable" ON storage.objects
FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users upload own stories" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own stories" ON storage.objects
FOR DELETE USING (bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- STORIES
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  media_url TEXT,
  media_type TEXT NOT NULL DEFAULT 'image', -- 'image' | 'video' | 'text'
  text_content TEXT,
  background_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active stories" ON public.stories
FOR SELECT TO authenticated USING (expires_at > now());
CREATE POLICY "Users insert own stories" ON public.stories
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own stories" ON public.stories
FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_stories_user ON public.stories(user_id);
CREATE INDEX idx_stories_expires ON public.stories(expires_at);

-- STORY VIEWS
CREATE TABLE public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owner and viewer see views" ON public.story_views
FOR SELECT TO authenticated USING (
  auth.uid() = viewer_id OR
  auth.uid() = (SELECT user_id FROM public.stories WHERE id = story_id)
);
CREATE POLICY "Users insert own views" ON public.story_views
FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);
CREATE INDEX idx_story_views_story ON public.story_views(story_id);

-- STORY REACTIONS
CREATE TABLE public.story_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Story owner and reactor see reactions" ON public.story_reactions
FOR SELECT TO authenticated USING (
  auth.uid() = user_id OR
  auth.uid() = (SELECT user_id FROM public.stories WHERE id = story_id)
);
CREATE POLICY "Users insert own reactions" ON public.story_reactions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- POST SHARES
CREATE TABLE public.post_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_type TEXT NOT NULL DEFAULT 'repost', -- 'repost' | 'story' | 'message' | 'link'
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shares" ON public.post_shares
FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own shares" ON public.post_shares
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own shares" ON public.post_shares
FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_post_shares_post ON public.post_shares(post_id);
CREATE INDEX idx_post_shares_user ON public.post_shares(user_id);

-- Update post shares_count automatically
CREATE OR REPLACE FUNCTION public.update_post_shares_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER trg_post_shares_count
AFTER INSERT OR DELETE ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.update_post_shares_count();

-- Notification on share
CREATE OR REPLACE FUNCTION public.notify_on_post_share()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM public.posts WHERE id = NEW.post_id),
      'post_share', 'a partagé votre publication', NEW.user_id, NEW.post_id
    );
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_post_share
AFTER INSERT ON public.post_shares
FOR EACH ROW EXECUTE FUNCTION public.notify_on_post_share();

-- Notification on story view (only first view)
CREATE OR REPLACE FUNCTION public.notify_on_story_reaction()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM public.stories WHERE id = NEW.story_id) THEN
    INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM public.stories WHERE id = NEW.story_id),
      'story_reaction', 'a réagi à votre story ' || NEW.emoji, NEW.user_id, NEW.story_id
    );
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_story_reaction
AFTER INSERT ON public.story_reactions
FOR EACH ROW EXECUTE FUNCTION public.notify_on_story_reaction();

-- Cleanup expired stories (can be called manually or via cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.stories WHERE expires_at < now();
END; $$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_shares;
