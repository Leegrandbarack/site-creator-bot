import { useState } from "react";
import LoginForm from "@/components/LoginForm";
import VerificationPage from "@/components/VerificationPage";

const Index = () => {
  const [showVerification, setShowVerification] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleSignupComplete = (phone: string) => {
    setPhoneNumber(phone);
    setShowVerification(true);
  };

  const handleBackToSignup = () => {
    setShowVerification(false);
  };

  if (showVerification) {
    return <VerificationPage phoneNumber={phoneNumber} onBack={handleBackToSignup} />;
  }

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-5xl w-full flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-16 py-10">
          {/* Left side - Branding */}
          <div className="text-center lg:text-left lg:flex-1 lg:pt-10">
            <svg viewBox="0 0 36 36" className="w-16 h-16 fill-primary mx-auto lg:mx-0 mb-4">
              <path d="M20.181 35.87C29.094 34.791 36 27.202 36 18c0-9.941-8.059-18-18-18S0 8.059 0 18c0 4.991 2.032 9.508 5.312 12.755V35l4.898-2.724A17.9 17.9 0 0 0 18 33.6c.725 0 1.439-.043 2.139-.126l.042-.005Z"/>
              <path fill="white" d="M24.5 22.5L25.5 18h-4v-2.5c0-1.25.6-2.5 2.6-2.5h2v-4s-1.8-.3-3.6-.3c-3.7 0-6 2.2-6 6.3v3h-4v4.5h4v11c.8.1 1.6.2 2.5.2s1.7-.1 2.5-.2v-11h3z"/>
            </svg>
            <h1 className="text-primary text-2xl lg:text-3xl font-bold leading-tight mb-2">
              Facebook vous permet de rester en contact avec les personnes qui comptent dans votre vie.
            </h1>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full max-w-md">
            <LoginForm onSignupComplete={handleSignupComplete} />
            <p className="text-center text-sm text-muted-foreground mt-6">
              <a href="#" className="font-bold text-foreground hover:underline">Créer une Page</a>
              {" "}pour une célébrité, une marque ou une entreprise.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card py-6 px-4 text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-wrap gap-2 mb-3">
            <a href="#">Français (France)</a>
            <a href="#">English (US)</a>
            <a href="#">Español</a>
            <a href="#">Português (Brasil)</a>
            <a href="#">Deutsch</a>
            <a href="#">العربية</a>
            <button className="border border-border px-2">+</button>
          </div>
          <div className="border-t border-border pt-3 flex flex-wrap gap-3">
            <a href="#">Inscription</a>
            <a href="#">Connexion</a>
            <a href="#">Messenger</a>
            <a href="#">Facebook Lite</a>
            <a href="#">Vidéo</a>
            <a href="#">Lieux</a>
            <a href="#">Jeux</a>
            <a href="#">Marketplace</a>
          </div>
          <p className="mt-4">Meta © 2026</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
