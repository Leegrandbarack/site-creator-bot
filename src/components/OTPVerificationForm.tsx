import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useOTPVerification } from "@/hooks/useOTPVerification";
import { CheckCircle2, Loader2, Phone, RefreshCw } from "lucide-react";

const OTPVerificationForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"phone" | "verify">("phone");
  
  const { 
    isLoading, 
    isSending, 
    isVerified, 
    devCode, 
    remainingAttempts,
    sendOTP, 
    verifyOTP,
    reset 
  } = useOTPVerification();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendOTP(phoneNumber);
    if (success) {
      setStep("verify");
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyOTP(phoneNumber, otpCode);
  };

  const handleResend = async () => {
    setOtpCode("");
    await sendOTP(phoneNumber);
  };

  const handleBack = () => {
    setStep("phone");
    setOtpCode("");
    reset();
  };

  const handleStartOver = () => {
    setPhoneNumber("");
    setOtpCode("");
    setStep("phone");
    reset();
  };

  if (isVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Vérification réussie !</h2>
            <p className="text-muted-foreground">
              Le numéro <span className="font-medium text-foreground">{phoneNumber}</span> a été vérifié avec succès.
            </p>
            <Button onClick={handleStartOver} variant="outline" className="mt-4">
              Vérifier un autre numéro
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5" />
          Vérification par SMS
        </CardTitle>
        <CardDescription>
          {step === "phone" 
            ? "Entrez votre numéro de téléphone pour recevoir un code de vérification"
            : "Entrez le code à 6 chiffres envoyé à votre téléphone"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+229 XX XX XX XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSending || phoneNumber.length < 8}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                "Envoyer le code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            {/* DEV MODE: Show the code */}
            {devCode && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-center">
                <p className="text-xs text-yellow-600 font-medium mb-1">🔧 Mode développement</p>
                <p className="text-lg font-mono font-bold text-yellow-800">{devCode}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Code de vérification</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpCode}
                  onChange={(value) => setOtpCode(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Code envoyé au {phoneNumber}
              </p>
              {remainingAttempts !== null && remainingAttempts <= 2 && (
                <p className="text-xs text-center text-destructive">
                  {remainingAttempts} tentative(s) restante(s)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier le code"
                )}
              </Button>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleBack}
                >
                  Retour
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleResend}
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Renvoyer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default OTPVerificationForm;
