import { Users, AlertTriangle, CalendarDays, Stethoscope } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatients } from "@/hooks/usePatients";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { useDoctors } from "@/hooks/useDoctors";

const ClinicDashboard = () => {
  const { patients, isLoading: loadingP } = usePatients();
  const { agendamentos, isLoading: loadingA } = useAgendamentos();
  const { unreadCount, isLoading: loadingN } = useNotificacoes();
  const { doctors, isLoading: loadingD } = useDoctors();

  const isLoading = loadingP || loadingA || loadingN || loadingD;
  const activePatients = patients.filter((p) => p.ativo).length;
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = agendamentos.filter((a) => a.data_do_agendamento === today).length;

  if (isLoading) {
    return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-lg" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Pacientes Ativos" value={activePatients} icon={Users} description={`${patients.length} total`} />
        <StatsCard title="Médicos" value={doctors.length} icon={Stethoscope} />
        <StatsCard title="Consultas Hoje" value={todayAppointments} icon={CalendarDays} description={`${agendamentos.length} total`} />
        <StatsCard title="Alertas Não Lidos" value={unreadCount} icon={AlertTriangle} />
      </div>

      {patients.length === 0 && (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Cadastre pacientes e médicos para ver o painel completo.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicDashboard;
