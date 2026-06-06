import { Building2, Stethoscope, Users, AlertTriangle } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [clinicas, medicos, pacientes, alertas] = await Promise.all([
        supabase.from("clinicas").select("id", { count: "exact", head: true }),
        supabase.from("cadastros").select("id", { count: "exact", head: true }).eq("cargo", "medico"),
        supabase.from("cadastros").select("id", { count: "exact", head: true }).eq("cargo", "paciente"),
        supabase.from("notificacoes").select("id", { count: "exact", head: true }).eq("vista", false),
      ]);
      return {
        clinicas: clinicas.count || 0,
        medicos: medicos.count || 0,
        pacientes: pacientes.count || 0,
        alertas: alertas.count || 0,
      };
    },
  });

  if (isLoading) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Clínicas Cadastradas" value={stats?.clinicas || 0} icon={Building2} />
        <StatsCard title="Médicos Ativos" value={stats?.medicos || 0} icon={Stethoscope} />
        <StatsCard title="Pacientes" value={stats?.pacientes || 0} icon={Users} />
        <StatsCard title="Alertas Não Lidos" value={stats?.alertas || 0} icon={AlertTriangle} />
      </div>
    </div>
  );
};

export default AdminDashboard;
