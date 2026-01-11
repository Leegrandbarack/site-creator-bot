-- Table pour stocker les codes de vérification OTP
CREATE TABLE public.verification_codes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour rechercher rapidement par numéro de téléphone
CREATE INDEX idx_verification_codes_phone ON public.verification_codes(phone_number);

-- Index pour nettoyer les codes expirés
CREATE INDEX idx_verification_codes_expires ON public.verification_codes(expires_at);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre l'insertion anonyme (avant connexion)
CREATE POLICY "Allow anonymous insert verification codes"
ON public.verification_codes
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy pour permettre la lecture anonyme (vérification du code)
CREATE POLICY "Allow anonymous select verification codes"
ON public.verification_codes
FOR SELECT
TO anon
USING (true);

-- Policy pour permettre la mise à jour anonyme (incrémenter les tentatives)
CREATE POLICY "Allow anonymous update verification codes"
ON public.verification_codes
FOR UPDATE
TO anon
USING (true);

-- Fonction pour nettoyer les codes expirés (à exécuter périodiquement)
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.verification_codes
    WHERE expires_at < now() OR verified = true;
END;
$$;