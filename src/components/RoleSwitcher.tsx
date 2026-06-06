import { useNavigate } from "react-router-dom";
import { useRole, RoleType } from "@/contexts/RoleContext";
import { Building2, Stethoscope, Shield, UserRound, Briefcase } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_CONFIG: Record<RoleType, { label: string; icon: React.ElementType }> = {
  admin: { label: "Administrador", icon: Shield },
  medico: { label: "Médico", icon: Stethoscope },
  paciente: { label: "Paciente", icon: UserRound },
  proprietario: { label: "Proprietário", icon: Building2 },
  funcionario: { label: "Funcionário", icon: Briefcase },
};

const ROLE_ROUTES: Record<RoleType, string> = {
  admin: "/admin/dashboard",
  medico: "/doctor/dashboard",
  paciente: "/patient/procedures",
  proprietario: "/clinic/dashboard",
  funcionario: "/clinic/dashboard",
};

const RoleSwitcher = () => {
  const { cadastros, activeRole, switchRole } = useRole();
  const navigate = useNavigate();

  // Filter out paciente since they have no access yet
  const roles = cadastros
    .map((c) => c.cargo as RoleType)
    .filter((r) => ROLE_CONFIG[r]);

  if (roles.length === 0 || !activeRole) return null;

  // Single role - just display it
  if (roles.length === 1) {
    const config = ROLE_CONFIG[roles[0]];
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span>{config.label}</span>
      </div>
    );
  }

  // Multiple roles - show switcher
  return (
    <Select value={activeRole} onValueChange={(v) => { switchRole(v as RoleType); navigate(ROLE_ROUTES[v as RoleType]); }}>
      <SelectTrigger className="h-8 text-xs border-border/50 bg-background/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = config.icon;
          return (
            <SelectItem key={role} value={role}>
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5" />
                <span>{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

export default RoleSwitcher;
