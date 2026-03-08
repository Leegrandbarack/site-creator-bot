-- ============================================
-- BASE DE DONNÉES COMPLÈTE - FACEBOOK CLONE
-- Compatible MySQL / PostgreSQL
-- ============================================

-- 1. TABLE DES UTILISATEURS (PROFILS)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username VARCHAR,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    birth_date DATE,
    gender TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TABLE DES PUBLICATIONS
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content TEXT,
    image_url TEXT,
    likes_count INTEGER NOT NULL DEFAULT 0,
    comments_count INTEGER NOT NULL DEFAULT 0,
    shares_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TABLE DES LIKES SUR LES PUBLICATIONS
CREATE TABLE post_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- 4. TABLE DES COMMENTAIRES
CREATE TABLE post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
    likes_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TABLE DES LIKES SUR LES COMMENTAIRES
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- 6. TABLE DES AMITIÉS
CREATE TABLE friendships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    addressee_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' ou 'accepted'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(requester_id, addressee_id)
);

-- 7. TABLE DES CONVERSATIONS
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TABLE DES PARTICIPANTS AUX CONVERSATIONS
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    last_read_at TIMESTAMPTZ DEFAULT now(),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(conversation_id, user_id)
);

-- 9. TABLE DES MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT,
    image_url TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. TABLE DES NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    from_user_id UUID,
    type TEXT NOT NULL,           -- 'friend_request', 'friend_accepted', 'post_like', 'post_comment', 'message', etc.
    message TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. TABLE DE PRÉSENCE EN LIGNE
CREATE TABLE user_presence (
    user_id UUID PRIMARY KEY,
    is_online BOOLEAN NOT NULL DEFAULT false,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. TABLE DES CODES DE VÉRIFICATION
CREATE TABLE verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. TABLE DES LOGS
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================
-- FONCTIONS & TRIGGERS
-- ============================================

-- Mise à jour automatique du compteur de likes
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Mise à jour automatique du compteur de commentaires
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Mise à jour automatique du compteur de likes sur commentaires
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Mise à jour de la conversation quand un message est envoyé
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_text = NEW.content,
      last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Notification automatique sur like de post
CREATE OR REPLACE FUNCTION notify_on_post_like()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'post_like', 'a aimé votre publication', NEW.user_id, NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_post_like
AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_on_post_like();

-- Notification automatique sur commentaire
CREATE OR REPLACE FUNCTION notify_on_post_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (
      (SELECT user_id FROM posts WHERE id = NEW.post_id),
      'post_comment', 'a commenté votre publication', NEW.user_id, NEW.post_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_post_comment
AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION notify_on_post_comment();

-- Notification automatique sur nouveau message
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
BEGIN
  FOR participant IN
    SELECT user_id FROM conversation_participants
    WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
  LOOP
    INSERT INTO notifications (user_id, type, message, from_user_id, reference_id)
    VALUES (participant.user_id, 'message', 'vous a envoyé un message', NEW.sender_id, NEW.conversation_id);
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();

-- Fonction utilitaire : vérifier si un user est membre d'une conversation
CREATE OR REPLACE FUNCTION is_conversation_member(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$ LANGUAGE sql STABLE;

-- Fonction utilitaire : créer une conversation avec un participant
CREATE OR REPLACE FUNCTION create_conversation_with_participant(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
BEGIN
  INSERT INTO conversations DEFAULT VALUES RETURNING id INTO conv_id;
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conv_id, auth.uid()), (conv_id, other_user_id);
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql;

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_posts_updated BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_friendships_updated BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Nettoyage des codes de vérification expirés
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS VOID AS $$
BEGIN
  DELETE FROM verification_codes WHERE expires_at < now() OR verified = true;
END;
$$ LANGUAGE plpgsql;

-- Création automatique du profil après inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id, email)
  VALUES (NEW.id, COALESCE(NEW.email, 'anonymous_' || NEW.id || '@local'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Profiles : tout le monde peut voir, seul le propriétaire modifie
CREATE POLICY "Tous peuvent voir les profils" ON profiles FOR SELECT USING (true);
CREATE POLICY "Modifier son profil" ON profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Créer son profil" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts : tout le monde peut voir, seul le propriétaire modifie/supprime
CREATE POLICY "Tous peuvent voir les posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Créer ses posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifier ses posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Supprimer ses posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Likes posts
CREATE POLICY "Voir les likes" ON post_likes FOR SELECT USING (true);
CREATE POLICY "Ajouter un like" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Retirer son like" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- Commentaires
CREATE POLICY "Voir les commentaires" ON post_comments FOR SELECT USING (true);
CREATE POLICY "Ajouter un commentaire" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Supprimer son commentaire" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- Likes commentaires
CREATE POLICY "Voir les likes commentaires" ON comment_likes FOR SELECT USING (true);
CREATE POLICY "Liker un commentaire" ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Retirer son like commentaire" ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Amitiés
CREATE POLICY "Voir ses amitiés" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Envoyer une demande" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Modifier ses amitiés" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Supprimer ses amitiés" ON friendships FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Conversations
CREATE POLICY "Voir ses conversations" ON conversations FOR SELECT USING (is_conversation_member(auth.uid(), id));
CREATE POLICY "Créer une conversation" ON conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Modifier sa conversation" ON conversations FOR UPDATE USING (is_conversation_member(auth.uid(), id));

-- Participants
CREATE POLICY "Voir les participants" ON conversation_participants FOR SELECT USING (true);
CREATE POLICY "Ajouter des participants" ON conversation_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Modifier sa participation" ON conversation_participants FOR UPDATE USING (user_id = auth.uid());

-- Messages
CREATE POLICY "Voir les messages de ses convos" ON messages FOR SELECT USING (is_conversation_member(auth.uid(), conversation_id));
CREATE POLICY "Envoyer un message" ON messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Modifier les messages" ON messages FOR UPDATE USING (is_conversation_member(auth.uid(), conversation_id));

-- Notifications
CREATE POLICY "Voir ses notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer des notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Modifier ses notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Supprimer ses notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- Présence
CREATE POLICY "Voir la présence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Mettre à jour sa présence" ON user_presence FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Insérer sa présence" ON user_presence FOR INSERT WITH CHECK (user_id = auth.uid());

-- Logs
CREATE POLICY "Voir ses logs" ON logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer ses logs" ON logs FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ============================================
-- INDEX POUR LES PERFORMANCES
-- ============================================
CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
CREATE INDEX idx_comments_post ON post_comments(post_id);
CREATE INDEX idx_comments_parent ON post_comments(parent_comment_id);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_messages_conv ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);


-- ============================================
-- ACTIVER LE REALTIME (Supabase)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
