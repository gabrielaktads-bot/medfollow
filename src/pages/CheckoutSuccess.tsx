import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Loader2 } from "lucide-react";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verificando pagamento...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setError("Sessão de pagamento não encontrada.");
      return;
    }

    const handleSuccess = async () => {
      try {
        setStatus("Confirmando pagamento...");

        const { data, error: fnError } = await supabase.functions.invoke(
          "handle-checkout-success",
          { body: { session_id: sessionId } }
        );

        if (fnError || data?.error) {
          throw new Error(data?.error || fnError?.message || "Erro ao processar pagamento");
        }

        setStatus("Configurando sua conta...");

        // Save price_id for onboarding to link plan to clinic
        if (data.price_id) {
          localStorage.setItem("checkout_price_id", data.price_id);
        }

        if (data.is_new_user && data.temp_password) {
          // New user: sign in with temporary password
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.temp_password,
          });

          if (signInError) {
            console.error("Sign in error:", signInError);
            toast({
              title: "Pagamento confirmado!",
              description: "Faça login com o e-mail " + data.email + " para configurar sua conta.",
            });
            navigate("/login");
            return;
          }

          setStatus("Bem-vindo ao MedFollow!");
          toast({ title: "Pagamento confirmado! 🎉" });
          navigate("/onboarding");
        } else {
          // Existing user
          toast({
            title: "Pagamento confirmado!",
            description: "Faça login com seu e-mail " + data.email + " para acessar sua conta.",
          });
          navigate("/login");
        }
      } catch (err: any) {
        console.error("Checkout success error:", err);
        setError(err.message);
      }
    };

    handleSuccess();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>MedFollow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="space-y-3">
              <p className="text-destructive font-medium">Ops! Algo deu errado</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-primary hover:underline"
              >
                Ir para login
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">{status}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckoutSuccess;
