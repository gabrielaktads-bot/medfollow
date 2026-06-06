import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Users, CreditCard, AlertTriangle, ExternalLink, ArrowUpRight } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/utils";
import type { Plano } from "@/hooks/usePlanos";

const ClinicPlanUsage = () => {
  const { activeCadastro, loading: loadingRole } = useRole();
  const sub = useSubscription();
  const { agendamentos, isLoading: loadingAgend } = useAgendamentos();
  const [staffCount, setStaffCount] = useState(0);
  const [loadingStaff, setLoadingStaff] = useState(true);

  // DB-first: load plan from clinic's plano_id
  const [dbPlano, setDbPlano] = useState<Plano | null>(null);
  const [loadingDbPlano, setLoadingDbPlano] = useState(true);

  const clinicaId = activeCadastro?.clinica_id;

  // Fetch the clinic's plano_id and then the plan details
  useEffect(() => {
    if (!clinicaId) {
      setLoadingDbPlano(false);
      return;
    }
    const fetchPlan = async () => {
      const { data: clinica } = await supabase
        .from("clinicas")
        .select("plano_id")
        .eq("id", clinicaId)
        .single();

      if (clinica?.plano_id) {
        const { data: plano } = await supabase
          .from("planos")
          .select("*")
          .eq("id", clinica.plano_id)
          .single();
        setDbPlano(plano as Plano | null);
      }
      setLoadingDbPlano(false);
    };
    fetchPlan();
  }, [clinicaId]);

  useEffect(() => {
    if (!clinicaId) {
      setLoadingStaff(false);
      return;
    }
    supabase
      .from("cadastros")
      .select("id", { count: "exact", head: true })
      .eq("clinica_id", clinicaId)
      .in("cargo", ["medico", "funcionario"])
      .eq("ativo", true)
      .then(({ count }) => {
        setStaffCount(count ?? 0);
        setLoadingStaff(false);
      });
  }, [clinicaId]);

  const isLoading = loadingRole || loadingAgend || loadingStaff || loadingDbPlano;

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Use DB plan as primary, fall back to Stripe-matched plan
  const plan = dbPlano ?? sub.currentPlano;

  // Count current month appointments
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyAppointments = agendamentos.filter(
    (a) => a.data_do_agendamento && a.data_do_agendamento.startsWith(currentMonth)
  ).length;

  const appointmentLimit = plan?.limite_agendamentos_mensal ?? 0;
  const userLimit = plan?.numero_de_usuarios ?? 0;

  const appointmentPercent = appointmentLimit > 0 ? Math.min(100, Math.round((monthlyAppointments / appointmentLimit) * 100)) : 0;
  const userPercent = userLimit > 0 ? Math.min(100, Math.round((staffCount / userLimit) * 100)) : 0;

  // Available plans for upgrade — only show plans MORE expensive than current
  const currentPrice = plan?.valor_mensal ?? 0;
  const upgradePlans = sub.planos.filter(
    (p) => p.ativo && p.stripe_price_id && p.stripe_price_id !== plan?.stripe_price_id && (p.valor_mensal ?? 0) > currentPrice
  );

  if (!plan) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center space-y-3 max-w-3xl">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="font-medium text-muted-foreground">Nenhuma assinatura ativa</h3>
        <p className="text-sm text-muted-foreground">
          Acesse a página de Conta para assinar um plano.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Meu Plano</h2>
        <Badge variant="default" className="text-sm px-3 py-1">{plan.nome_do_plano}</Badge>
      </div>

      {/* Plan details card */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">Detalhes da Assinatura</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Plano atual</p>
            <p className="font-semibold text-lg">{plan.nome_do_plano}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Valor mensal</p>
            <p className="font-semibold text-lg">{formatBRL(plan.valor_mensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          </div>
          {plan.valor_anual != null && plan.valor_anual > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Valor anual</p>
              <p className="font-medium">{formatBRL(plan.valor_anual)}<span className="text-sm font-normal text-muted-foreground">/ano</span></p>
            </div>
          )}
          {sub.subscriptionEnd && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Próxima fatura</p>
              <p className="font-medium">{new Date(sub.subscriptionEnd).toLocaleDateString("pt-BR")}</p>
            </div>
          )}
        </div>

        <Separator />

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={sub.openPortal}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Gerenciar Assinatura
          </Button>
        </div>
      </div>

      {/* Usage cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Appointments usage */}
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Agendamentos do Mês</h3>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl font-bold">{monthlyAppointments}<span className="text-lg font-normal text-muted-foreground">/{appointmentLimit}</span></p>
            <p className="text-xs text-muted-foreground mt-1">agendamentos utilizados</p>
          </div>
          <Progress value={appointmentPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{appointmentPercent}% utilizado</span>
            <span>{Math.max(0, appointmentLimit - monthlyAppointments)} restantes</span>
          </div>
          {appointmentPercent >= 90 && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>Próximo do limite de agendamentos</span>
            </div>
          )}
        </div>

        {/* Users usage */}
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Usuários da Clínica</h3>
          </div>
          <div className="text-center py-2">
            <p className="text-3xl font-bold">{staffCount}<span className="text-lg font-normal text-muted-foreground">/{userLimit}</span></p>
            <p className="text-xs text-muted-foreground mt-1">médicos e funcionários</p>
          </div>
          <Progress value={userPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{userPercent}% utilizado</span>
            <span>{Math.max(0, userLimit - staffCount)} restantes</span>
          </div>
          {userPercent >= 90 && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span>Próximo do limite de usuários</span>
            </div>
          )}
        </div>
      </div>

      {/* Plan limits summary */}
      <div className="rounded-lg border bg-card p-5 space-y-3">
        <h3 className="font-semibold">Recursos do Plano</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Agendamentos/mês</span>
            <span className="font-medium">{appointmentLimit}</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-muted/50">
            <span className="text-muted-foreground">Usuários</span>
            <span className="font-medium">{userLimit}</span>
          </div>
        </div>
      </div>

      {/* Upgrade options */}
      {upgradePlans.length > 0 && (
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Fazer Upgrade</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {upgradePlans.map((p) => (
              <div key={p.id} className="rounded-lg border p-4 space-y-2">
                <h4 className="font-medium">{p.nome_do_plano}</h4>
                <p className="text-2xl font-bold">{formatBRL(p.valor_mensal)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{p.limite_agendamentos_mensal ?? 0} agendamentos/mês</p>
                  <p>{p.numero_de_usuarios ?? 0} usuários</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={sub.openPortal}>
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Gerenciar no Portal de Pagamento
          </Button>
        </div>
      )}
    </div>
  );
};

export default ClinicPlanUsage;
