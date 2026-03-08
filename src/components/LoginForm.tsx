import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import SignupModal from "./SignupModal";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login")) {
        toast.error("Email ou mot de passe incorrect");
      } else {
        toast.error(error.message);
      }
      return;
    }
    navigate("/dashboard");
  };

  const handleSignupComplete = () => {
    navigate("/dashboard");
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-lg p-4 w-full max-w-md">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Adresse e-mail"
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
            disabled={loading}
            className="w-full h-12 text-xl font-bold bg-primary hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <div className="text-center mt-4">
          <a href="#" className="text-primary hover:underline text-sm">
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
        onSignupComplete={handleSignupComplete}
      />
    </>
  );
};

export default LoginForm;
