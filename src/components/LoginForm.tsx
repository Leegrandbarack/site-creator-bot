import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignupModal from "./SignupModal";

interface LoginFormProps {
  onSignupComplete?: (phoneNumber: string, devCode?: string) => void;
}

const LoginForm = ({ onSignupComplete }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSignup, setShowSignup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt:", { email, password });
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-lg p-4 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="text"
            placeholder="Adresse e-mail ou numéro de tél."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 text-base border-border focus:border-primary"
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-base border-border focus:border-primary"
          />
          <Button
            type="submit"
            className="w-full h-12 text-xl font-bold bg-primary hover:bg-primary/90"
          >
            Se connecter
          </Button>
        </form>

        <div className="text-center mt-4">
          <a
            href="#"
            className="text-primary hover:underline text-sm"
          >
            Mot de passe oublié ?
          </a>
        </div>

        <div className="border-t border-border my-5"></div>

        <div className="text-center">
          <Button
            variant="secondary"
            className="h-12 px-4 text-lg font-bold"
            onClick={() => setShowSignup(true)}
          >
            Créer un nouveau compte
          </Button>
        </div>
      </div>

      <SignupModal 
        open={showSignup} 
        onOpenChange={setShowSignup} 
        onSignupComplete={onSignupComplete}
      />
    </>
  );
};

export default LoginForm;
