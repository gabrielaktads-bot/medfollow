import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import RoleRouter from "@/components/RoleRouter";
import RoleGuard from "@/components/RoleGuard";

import DashboardLayout from "@/components/DashboardLayout";
import { useRole } from "@/contexts/RoleContext";
import Auth from "@/pages/Auth";
import Onboarding from "@/pages/Onboarding";
import CheckoutSuccess from "@/pages/CheckoutSuccess";
import NotFound from "@/pages/NotFound";
import PublicPlans from "@/pages/PublicPlans";
import PublicDocument from "@/pages/PublicDocument";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminClinics from "@/pages/admin/AdminClinics";
import AdminPlans from "@/pages/admin/AdminPlans";
import AdminTemplates from "@/pages/admin/AdminTemplates";
import AdminAlerts from "@/pages/admin/AdminAlerts";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminAI from "@/pages/admin/AdminAI";

// Clinic pages
import ClinicDashboard from "@/pages/clinic/ClinicDashboard";
import ClinicPatients from "@/pages/clinic/ClinicPatients";
import PatientProntuario from "@/pages/clinic/PatientProntuario";
import ClinicDoctors from "@/pages/clinic/ClinicDoctors";
import ClinicFlows from "@/pages/clinic/ClinicFlows";
import ClinicAlerts from "@/pages/clinic/ClinicAlerts";
import ClinicSchedule from "@/pages/clinic/ClinicSchedule";
import ClinicAccount from "@/pages/clinic/ClinicAccount";
import ClinicAgent from "@/pages/clinic/ClinicAgent";
import ClinicPlanUsage from "@/pages/clinic/ClinicPlanUsage";

// Doctor pages
import DoctorDashboard from "@/pages/doctor/DoctorDashboard";
import DoctorPatients from "@/pages/doctor/DoctorPatients";
import DoctorFlows from "@/pages/doctor/DoctorFlows";
import DoctorAlerts from "@/pages/doctor/DoctorAlerts";
import DoctorSchedule from "@/pages/doctor/DoctorSchedule";
import DoctorAccount from "@/pages/doctor/DoctorAccount";

// Patient pages
import PatientProcedures from "@/pages/patient/PatientProcedures";
import PatientProfile from "@/pages/patient/PatientProfile";
import PatientChat from "@/pages/patient/PatientChat";

import {
  LayoutDashboard,
  Building2,
  CreditCard,
  FileText,
  AlertTriangle,
  Settings,
  Brain,
  Users,
  Stethoscope,
  GitBranch,
  CalendarDays,
  UserCircle,
  ClipboardList,
  MessageCircle,
  Bot,
} from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    },
  },
});

const adminNav = [
  { title: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Clínicas", path: "/admin/clinics", icon: Building2 },
  { title: "Planos", path: "/admin/plans", icon: CreditCard },
  { title: "Templates", path: "/admin/templates", icon: FileText },
  { title: "Alertas", path: "/admin/alerts", icon: AlertTriangle },
  { title: "Configurações", path: "/admin/settings", icon: Settings },
  { title: "Inteligência Artificial", path: "/admin/ai", icon: Brain },
];

const clinicNav = [
  { title: "Dashboard", path: "/clinic/dashboard", icon: LayoutDashboard },
  { title: "Pacientes", path: "/clinic/patients", icon: Users },
  { title: "Médicos", path: "/clinic/doctors", icon: Stethoscope },
  { title: "Alertas", path: "/clinic/alerts", icon: AlertTriangle },
  { title: "Agenda", path: "/clinic/schedule", icon: CalendarDays },
  { title: "Agente IA", path: "/clinic/agent", icon: Bot },
  { title: "Meu Plano", path: "/clinic/plan", icon: CreditCard },
  { title: "Conta", path: "/clinic/account", icon: UserCircle },
];

const doctorNav = [
  { title: "Dashboard", path: "/doctor/dashboard", icon: LayoutDashboard },
  { title: "Pacientes", path: "/doctor/patients", icon: Users },
  { title: "Alertas", path: "/doctor/alerts", icon: AlertTriangle },
  { title: "Agenda", path: "/doctor/schedule", icon: CalendarDays },
  { title: "Conta", path: "/doctor/account", icon: UserCircle },
];

const patientNav = [
  { title: "Procedimentos", path: "/patient/procedures", icon: ClipboardList },
  { title: "Meu Perfil", path: "/patient/profile", icon: UserCircle },
  { title: "Chat IA", path: "/patient/chat", icon: MessageCircle },
];

const PatientLayout = () => {
  const { activeCadastro } = useRole();
  const nav = activeCadastro?.bloqueio_chat
    ? patientNav.filter(item => item.path !== "/patient/chat")
    : patientNav;
  return <DashboardLayout navItems={nav} title="Área do Paciente" subtitle="Paciente" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RoleProvider>
            <Routes>
              <Route path="/login" element={<Auth />} />
              <Route path="/planos" element={<PublicPlans />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              <Route path="/doc/:token" element={<PublicDocument />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

              {/* Root redirects based on role */}
              <Route path="/" element={<ProtectedRoute><RoleRouter /></ProtectedRoute>} />

              {/* Admin */}
              <Route path="/admin" element={<ProtectedRoute><RoleGuard allowedRoles={["admin"]}><DashboardLayout navItems={adminNav} title="Painel Administrador" subtitle="Administração" /></RoleGuard></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="clinics" element={<AdminClinics />} />
                <Route path="plans" element={<AdminPlans />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="alerts" element={<AdminAlerts />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="ai" element={<AdminAI />} />
              </Route>

              {/* Clinic */}
              <Route path="/clinic" element={<ProtectedRoute><RoleGuard allowedRoles={["proprietario", "funcionario"]}><DashboardLayout navItems={clinicNav} title="Painel da Clínica" subtitle="Clínica" /></RoleGuard></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<ClinicDashboard />} />
                <Route path="patients" element={<ClinicPatients />} />
                <Route path="patients/:patientId" element={<PatientProntuario />} /> {/* legacy redirect handled below */}
                <Route path="doctors" element={<ClinicDoctors />} />
                <Route path="flows" element={<ClinicFlows />} />
                <Route path="alerts" element={<ClinicAlerts />} />
                <Route path="schedule" element={<ClinicSchedule />} />
                <Route path="agent" element={<ClinicAgent />} />
                <Route path="plan" element={<ClinicPlanUsage />} />
                <Route path="account" element={<ClinicAccount />} />
              </Route>

              {/* Doctor Solo */}
              <Route path="/doctor" element={<ProtectedRoute><RoleGuard allowedRoles={["medico"]}><DashboardLayout navItems={doctorNav} title="Painel do Médico" subtitle="Médico Solo" /></RoleGuard></ProtectedRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DoctorDashboard />} />
                <Route path="patients" element={<DoctorPatients />} />
                <Route path="patients/:patientId" element={<PatientProntuario />} />
                <Route path="flows" element={<DoctorFlows />} />
                <Route path="alerts" element={<DoctorAlerts />} />
                <Route path="schedule" element={<DoctorSchedule />} />
                <Route path="account" element={<DoctorAccount />} />
              </Route>

              {/* Patient */}
              <Route path="/patient" element={<ProtectedRoute><RoleGuard allowedRoles={["paciente"]}><PatientLayout /></RoleGuard></ProtectedRoute>}>
                <Route index element={<Navigate to="procedures" replace />} />
                <Route path="procedures" element={<PatientProcedures />} />
                <Route path="profile" element={<PatientProfile />} />
                <Route path="chat" element={<PatientChat />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </RoleProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
