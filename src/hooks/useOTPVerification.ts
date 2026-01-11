import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseOTPVerificationReturn {
  isLoading: boolean;
  isSending: boolean;
  isVerified: boolean;
  devCode: string | null;
  remainingAttempts: number | null;
  sendOTP: (phoneNumber: string) => Promise<boolean>;
  verifyOTP: (phoneNumber: string, code: string) => Promise<boolean>;
  reset: () => void;
}

export const useOTPVerification = (): UseOTPVerificationReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const { toast } = useToast();

  const sendOTP = async (phoneNumber: string): Promise<boolean> => {
    setIsSending(true);
    setDevCode(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phoneNumber },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Impossible d'envoyer le code",
        });
        return false;
      }

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.error,
        });
        return false;
      }

      // DEV MODE: Store the code for display
      if (data.devCode) {
        setDevCode(data.devCode);
      }

      toast({
        title: "Code envoyé",
        description: "Vérifiez la console pour voir le code (mode développement)",
      });

      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      });
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const verifyOTP = async (phoneNumber: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phoneNumber, code },
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message || "Impossible de vérifier le code",
        });
        return false;
      }

      if (data.error) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        toast({
          variant: "destructive",
          title: "Code incorrect",
          description: data.error,
        });
        return false;
      }

      if (data.verified) {
        setIsVerified(true);
        setDevCode(null);
        toast({
          title: "Vérifié !",
          description: "Votre numéro de téléphone a été vérifié avec succès",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setIsVerified(false);
    setDevCode(null);
    setRemainingAttempts(null);
  };

  return {
    isLoading,
    isSending,
    isVerified,
    devCode,
    remainingAttempts,
    sendOTP,
    verifyOTP,
    reset,
  };
};
