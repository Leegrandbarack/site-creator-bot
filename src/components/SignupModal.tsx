import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignupComplete?: (phoneNumber: string) => void;
}

const SignupModal = ({ open, onOpenChange, onSignupComplete }: SignupModalProps) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [day, setDay] = useState("10");
  const [month, setMonth] = useState("jan");
  const [year, setYear] = useState("2026");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast.error("Veuillez entrer un numéro de téléphone");
      return;
    }

    // Validate phone number format (at least 8 digits)
    const cleanPhone = phone.replace(/\s/g, '');
    if (cleanPhone.length < 8 || !/^\+?[0-9]+$/.test(cleanPhone)) {
      toast.error("Numéro de téléphone invalide. Utilisez le format: +229XXXXXXXX");
      return;
    }

    setIsLoading(true);

    try {
      // Send OTP to the phone number
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { phoneNumber: cleanPhone }
      });

      if (error) throw error;

      if (data.success) {
        toast.success("Code de vérification envoyé!");
        
        // Log the code in development (shown in console)
        if (data.code) {
          console.log("🔐 Code de vérification (dev):", data.code);
        }
        
        if (onSignupComplete) {
          onSignupComplete(cleanPhone);
          onOpenChange(false);
        }
      } else {
        throw new Error(data.error || "Erreur lors de l'envoi du code");
      }
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de l'envoi du code");
    } finally {
      setIsLoading(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: "jan", label: "jan" },
    { value: "fev", label: "fév" },
    { value: "mar", label: "mars" },
    { value: "avr", label: "avr" },
    { value: "mai", label: "mai" },
    { value: "juin", label: "juin" },
    { value: "juil", label: "juil" },
    { value: "aou", label: "août" },
    { value: "sep", label: "sep" },
    { value: "oct", label: "oct" },
    { value: "nov", label: "nov" },
    { value: "dec", label: "déc" },
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 120 }, (_, i) => (currentYear - i).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <DialogTitle className="text-2xl font-bold text-foreground">Créer un compte</DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            C'est simple et rapide.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Prénom"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-10 text-sm bg-input border-border"
            />
            <Input
              placeholder="Nom de famille"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-10 text-sm bg-input border-border"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              Date de naissance
              <HelpCircle className="w-3 h-3" />
            </label>
            <div className="flex gap-2">
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="flex-1 h-9 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {days.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="flex-1 h-9 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="flex-1 h-9 bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              Genre
              <HelpCircle className="w-3 h-3" />
            </label>
            <div className="flex gap-2">
              {[
                { value: "femme", label: "Femme" },
                { value: "homme", label: "Homme" },
                { value: "personnalise", label: "Personnalisé" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex-1 flex items-center justify-between px-3 py-2 border border-border rounded-md cursor-pointer hover:bg-muted/50"
                >
                  <span className="text-sm">{option.label}</span>
                  <input
                    type="radio"
                    name="gender"
                    value={option.value}
                    checked={gender === option.value}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-4 h-4 accent-primary"
                  />
                </label>
              ))}
            </div>
          </div>

          <Input
            type="tel"
            placeholder="Numéro de téléphone (ex: +22997123456)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="h-10 text-sm bg-input border-border"
          />

          <Input
            type="email"
            placeholder="Adresse e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-sm bg-input border-border"
          />

          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 text-sm bg-input border-border"
          />

          <p className="text-xs text-muted-foreground">
            Les personnes qui utilisent notre service ont pu importer vos coordonnées sur Facebook.{" "}
            <a href="#" className="text-primary hover:underline">En savoir plus.</a>
          </p>

          <p className="text-xs text-muted-foreground">
            En cliquant sur S'inscrire, vous acceptez nos{" "}
            <a href="#" className="text-primary hover:underline">Conditions générales</a>, notre{" "}
            <a href="#" className="text-primary hover:underline">Politique de confidentialité</a> et notre{" "}
            <a href="#" className="text-primary hover:underline">Politique d'utilisation des cookies</a>.
            Vous recevrez peut-être des notifications par SMS de notre part et vous pouvez à tout moment vous désabonner.
          </p>

          <div className="flex justify-center pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 px-16 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </div>

          <div className="text-center pt-2">
            <a
              href="#"
              className="text-primary hover:underline text-sm"
              onClick={(e) => {
                e.preventDefault();
                onOpenChange(false);
              }}
            >
              Vous avez déjà un compte ?
            </a>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignupModal;
