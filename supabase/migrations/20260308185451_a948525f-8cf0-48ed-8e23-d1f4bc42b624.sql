
-- Fix infinite recursion on conversation_participants SELECT policy
-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view participants of own conversations" ON public.conversation_participants;

-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_member(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

-- New non-recursive SELECT policy
CREATE POLICY "Users can view participants of own conversations"
ON public.conversation_participants
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(auth.uid(), conversation_id)
);

-- Also fix conversations and messages policies that reference conversation_participants
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(auth.uid(), id)
);

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (
  public.is_conversation_member(auth.uid(), id)
);

DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
CREATE POLICY "Users can view messages in own conversations"
ON public.messages
FOR SELECT
TO authenticated
USING (
  public.is_conversation_member(auth.uid(), conversation_id)
);

DROP POLICY IF EXISTS "Users can send messages to own conversations" ON public.messages;
CREATE POLICY "Users can send messages to own conversations"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND public.is_conversation_member(auth.uid(), conversation_id)
);
