import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface VerificationPageProps {
  phoneNumber: string;
  devCode?: string | null;
  onBack: () => void;
}

const VerificationPage = ({ phoneNumber, devCode: initialDevCode, onBack }: VerificationPageProps) => {
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(initialDevCode || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleContinue = async () => {
    if (!code) {
      toast.error("Veuillez entrer le code de vérification");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { phoneNumber, code }
      });

      if (error) throw error;

      if (data.success) {
        setIsVerified(true);
        toast.success("Compte vérifié avec succès!");
      } else {
        throw new Error(data.error || "Code invalide");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSMS = async () => {
    setIsResending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phoneNumber }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Nouveau code envoyé!");
        if (data.devCode) {
          setDevCode(data.devCode);
        }
      } else {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'envoi du code");
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <header className="bg-card shadow-sm py-3 px-4">
          <div className="max-w-5xl mx-auto">
            <svg viewBox="0 0 36 36" className="w-10 h-10 fill-primary">
              <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z"/>
              <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z"/>
            </svg>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Compte vérifié!
            </h1>
            <p className="text-muted-foreground mb-6">
              Votre numéro {phoneNumber} a été vérifié avec succès.
            </p>
            <Button
              onClick={onBack}
              className="bg-primary hover:bg-primary/90"
            >
              Retour à l'accueil
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm py-3 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <svg viewBox="0 0 36 36" className="w-10 h-10 fill-primary">
            <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z"/>
            <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z"/>
          </svg>
          <button className="text-foreground text-sm">▼</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center pt-16 px-4">
        <div className="bg-card rounded-lg shadow-lg p-6 w-full max-w-lg">
          <h1 className="text-xl font-bold text-foreground mb-3">
            Entrez le code de confirmation reçu par texto
          </h1>
          
          <p className="text-muted-foreground text-sm mb-4">
            Indiquez que ce numéro de mobile vous appartient. Entrez le code du SMS envoyé au{" "}
            <span className="font-bold text-foreground">{phoneNumber}</span>.
          </p>

          {devCode && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>🔐 Mode dev:</strong> Votre code est <span className="font-mono font-bold text-lg">{devCode}</span>
              </p>
            </div>
          )}

          <div className="mb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">FB-</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-12 text-base border-primary focus:border-primary"
                placeholder="123456"
                maxLength={6}
              />
            </div>
          </div>

          <button
            onClick={handleResendSMS}
            disabled={isResending}
            className="text-primary hover:underline text-sm mb-6 block disabled:opacity-50"
          >
            {isResending ? "Envoi en cours..." : "Renvoyer le SMS"}
          </button>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onBack}
              className="h-10 px-4 font-medium border-border"
            >
              Mettre à jour les coordonnées
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!code || isLoading}
              className="h-10 px-6 font-medium bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Vérification...
                </>
              ) : (
                "Continuer"
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 px-4 mt-auto">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <a href="#" className="hover:underline">À propos</a>
          <a href="#" className="hover:underline">Politique de confidentialité</a>
          <a href="#" className="hover:underline">Cookies</a>
          <a href="#" className="hover:underline">Choisir sa publicité ▷</a>
          <a href="#" className="hover:underline">Conditions générales</a>
          <a href="#" className="hover:underline">Aide</a>
        </div>
      </footer>
    </div>
  );
};

export default VerificationPage;
