
-- Drop all restrictive policies on conversations
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT TO authenticated USING (is_conversation_member(auth.uid(), id));
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (is_conversation_member(auth.uid(), id));

-- Drop all restrictive policies on conversation_participants
DROP POLICY IF EXISTS "Users can view participants of own conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.conversation_participants;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view participants of own conversations" ON public.conversation_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can add participants" ON public.conversation_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own participation" ON public.conversation_participants FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Drop all restrictive policies on messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to own conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT TO authenticated USING (is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Users can send messages to own conversations" ON public.messages FOR INSERT TO authenticated WITH CHECK ((sender_id = auth.uid()) AND is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Users can update messages in own conversations" ON public.messages FOR UPDATE TO authenticated USING (is_conversation_member(auth.uid(), conversation_id));
