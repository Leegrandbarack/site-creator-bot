
CREATE OR REPLACE FUNCTION public.create_conversation_with_participant(other_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  conv_id uuid;
BEGIN
  -- Create conversation
  INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO conv_id;
  
  -- Add both participants
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);
  
  RETURN conv_id;
END;
$$;
