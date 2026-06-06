import { Link } from "react-router-dom";
import { Building2, Stethoscope, UserRound, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const roles = [
  {
    title: "Administrador",
    description: "Painel completo de gestão da plataforma MedFollow",
    icon: Building2,
    path: "/admin",
    color: "bg-primary",
  },
  {
    title: "Clínica",
    description: "Gestão de pacientes, médicos, fluxos e agendamentos",
    icon: Stethoscope,
    path: "/clinic",
    color: "bg-medical-info",
  },
  {
    title: "Médico Solo",
    description: "Acompanhamento direto dos seus pacientes e consultas",
    icon: UserRound,
    path: "/doctor",
    color: "bg-medical-success",
  },
];

const Login = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="mb-10 text-center animate-fade-in">
        <img src="/favicon.png" alt="MedFollow" className="mx-auto mb-4 h-16 w-auto" />
        <h1 className="text-3xl font-bold text-foreground">MedFollow</h1>
        <p className="mt-2 text-muted-foreground">Selecione o tipo de acesso para continuar</p>
        {user && (
          <p className="mt-1 text-sm text-muted-foreground">
            Logado como <span className="font-medium text-foreground">{user.email}</span>
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-3 w-full max-w-3xl">
        {roles.map((role, i) => (
          <Link
            key={role.path}
            to={role.path}
            className="group rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`inline-flex rounded-lg p-3 ${role.color}`}>
              <role.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">{role.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
          </Link>
        ))}
      </div>

      <Button
        variant="ghost"
        onClick={signOut}
        className="mt-8 text-muted-foreground hover:text-destructive"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Sair da conta
      </Button>
    </div>
  );
};

export default Login;
