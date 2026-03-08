
-- Trigger: notify on new post like
CREATE OR REPLACE FUNCTION public.notify_on_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Don't notify if user likes their own post
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM public.posts WHERE id = NEW.post_id),
      'post_like',
      'a aimé votre publication',
      NEW.user_id,
      NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_like_notify
  AFTER INSERT ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_like();

-- Trigger: notify on new comment
CREATE OR REPLACE FUNCTION public.notify_on_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Don't notify if user comments on their own post
  IF NEW.user_id != (SELECT user_id FROM public.posts WHERE id = NEW.post_id) THEN
    INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM public.posts WHERE id = NEW.post_id),
      'post_comment',
      'a commenté votre publication',
      NEW.user_id,
      NEW.post_id
    );
  END IF;
  -- Notify parent comment author for replies
  IF NEW.parent_comment_id IS NOT NULL THEN
    IF NEW.user_id != (SELECT user_id FROM public.post_comments WHERE id = NEW.parent_comment_id) THEN
      INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
      VALUES (
        (SELECT user_id FROM public.post_comments WHERE id = NEW.parent_comment_id),
        'comment_reply',
        'a répondu à votre commentaire',
        NEW.user_id,
        NEW.post_id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_comment_notify
  AFTER INSERT ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_post_comment();

-- Trigger: notify on comment like
CREATE OR REPLACE FUNCTION public.notify_on_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM public.post_comments WHERE id = NEW.comment_id) THEN
    INSERT INTO public.notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM public.post_comments WHERE id = NEW.comment_id),
      'comment_like',
      'a aimé votre commentaire',
      NEW.user_id,
      NEW.comment_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_comment_like_notify
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_comment_like();
