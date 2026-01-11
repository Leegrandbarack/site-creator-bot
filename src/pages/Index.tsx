import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoginForm from "@/components/LoginForm";
import VerificationPage from "@/components/VerificationPage";
import OTPVerificationForm from "@/components/OTPVerificationForm";

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
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-primary text-4xl font-bold tracking-tight mb-2">
              Système de Vérification OTP
            </h1>
            <p className="text-muted-foreground">
              Démonstration de l'authentification par SMS
            </p>
          </div>

          <Tabs defaultValue="otp" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="otp">Vérification OTP</TabsTrigger>
              <TabsTrigger value="login">Connexion classique</TabsTrigger>
            </TabsList>
            <TabsContent value="otp">
              <OTPVerificationForm />
            </TabsContent>
            <TabsContent value="login">
              <div className="max-w-md mx-auto">
                <LoginForm onSignupComplete={handleSignupComplete} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-muted-foreground">
        <p>Projet de démonstration - Vérification OTP</p>
      </footer>
    </div>
  );
};

export default Index;
