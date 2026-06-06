import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPublicCheckout } from "@/lib/checkout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Users, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Plano {
  id: string;
  nome_do_plano: string;
  valor_mensal: number | null;
  limite_agendamentos_mensal: number | null;
  numero_de_usuarios: number | null;
  stripe_price_id: string | null;
}

const PublicPlans = () => {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanos = async () => {
      const { data, error } = await supabase
        .from("planos")
        .select("id, nome_do_plano, valor_mensal, limite_agendamentos_mensal, numero_de_usuarios, stripe_price_id")
        .eq("ativo", true)
        .order("valor_mensal");
      if (error) {
        console.error("Error fetching planos:", error);
      } else {
        setPlanos(data || []);
      }
      setLoading(false);
    };
    fetchPlanos();
  }, []);

  const handleCheckout = async (plano: Plano) => {
    if (!plano.stripe_price_id) {
      toast({ title: "Plano sem preço configurado", variant: "destructive" });
      return;
    }
    setCheckoutLoading(plano.id);
    try {
      await createPublicCheckout(plano.stripe_price_id);
    } catch (err) {
      console.error(err);
      toast({ title: "Erro ao iniciar checkout", description: String(err), variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value == null) return "—";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-4xl font-bold text-foreground mb-3">MedFollow</h1>
        <p className="text-lg text-muted-foreground">
          Escolha o plano ideal para sua clínica e comece a gerenciar seus pacientes com inteligência.
        </p>
      </div>

      {loading ? (
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      ) : planos.length === 0 ? (
        <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-full max-w-5xl">
          {planos.map((plano) => (
            <Card key={plano.id} className="flex flex-col justify-between border-border">
              <CardHeader>
                <CardTitle className="text-xl">{plano.nome_do_plano}</CardTitle>
                <p className="text-3xl font-bold text-primary mt-2">
                  {formatCurrency(plano.valor_mensal)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  <span>
                    {plano.limite_agendamentos_mensal
                      ? `${plano.limite_agendamentos_mensal} agendamentos/mês`
                      : "Agendamentos ilimitados"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>
                    {plano.numero_de_usuarios
                      ? `${plano.numero_de_usuarios} usuários`
                      : "Usuários ilimitados"}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!plano.stripe_price_id || checkoutLoading === plano.id}
                  onClick={() => handleCheckout(plano)}
                >
                  {checkoutLoading === plano.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Assinar
                </Button>
                {!plano.stripe_price_id && (
                  <Badge variant="secondary" className="ml-2 text-xs">Em breve</Badge>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicPlans;
