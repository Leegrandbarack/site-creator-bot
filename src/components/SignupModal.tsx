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
import { HelpCircle } from "lucide-react";

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
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Signup attempt:", { firstName, lastName, day, month, year, gender, emailOrPhone, password });
    if (onSignupComplete && emailOrPhone) {
      onSignupComplete(emailOrPhone);
      onOpenChange(false);
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
            placeholder="Numéro mobile ou e-mail"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
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
              className="h-9 px-16 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              S'inscrire
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
