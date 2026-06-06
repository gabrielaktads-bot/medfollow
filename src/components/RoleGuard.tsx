import { Navigate } from "react-router-dom";
import { useRole, RoleType } from "@/contexts/RoleContext";
import { ShieldOff } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: RoleType[];
  children: React.ReactNode;
}

const RoleGuard = ({ allowedRoles, children }: RoleGuardProps) => {
  const { activeRole, activeCadastro, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!activeRole || !allowedRoles.includes(activeRole)) {
    return <Navigate to="/" replace />;
  }

  if (activeCadastro && activeCadastro.ativo === false && (activeRole === "paciente" || activeRole === "medico")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-sm">
          <ShieldOff className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Conta desativada</h2>
          <p className="text-muted-foreground text-sm">
            O seu acesso foi desativado pela clínica. Entre em contato com a equipe responsável para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
