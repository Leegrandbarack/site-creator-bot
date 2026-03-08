
-- Fix: handle_new_user must handle anonymous users (no email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, COALESCE(NEW.email, 'anonymous_' || NEW.id || '@local'));
    RETURN NEW;
END;
$$;
