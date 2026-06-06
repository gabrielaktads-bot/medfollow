import { Navigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";

const ROLE_ROUTES: Record<string, string> = {
  admin: "/admin/dashboard",
  medico: "/doctor/dashboard",
  proprietario: "/clinic/dashboard",
  funcionario: "/clinic/dashboard",
  paciente: "/patient/procedures",
};

const RoleRouter = () => {
  const { activeRole, loading } = useRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (activeRole && ROLE_ROUTES[activeRole]) {
    return <Navigate to={ROLE_ROUTES[activeRole]} replace />;
  }

  // No valid roles
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">Sem acesso</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nenhum cadastro com acesso encontrado para este usuário.
        </p>
      </div>
    </div>
  );
};

export default RoleRouter;
