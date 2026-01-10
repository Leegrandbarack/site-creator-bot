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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-16">
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left lg:pt-10 max-w-md">
            <h1 className="text-primary text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              facebook
            </h1>
            <p className="text-foreground text-xl lg:text-2xl leading-relaxed">
              Avec Facebook, partagez et restez en contact avec votre entourage.
            </p>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md">
            <LoginForm onSignupComplete={handleSignupComplete} />
            <p className="text-center text-sm text-foreground mt-6">
              <a href="#" className="font-bold hover:underline">
                Créer une Page
              </a>{" "}
              pour une célébrité, une marque ou une entreprise.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground">
        <p>Clone Facebook - Projet de démonstration</p>
      </footer>
    </div>
  );
};

export default Index;
