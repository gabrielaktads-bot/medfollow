import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type RoleType = "admin" | "medico" | "paciente" | "proprietario" | "funcionario";

interface Cadastro {
  id: string;
  cargo: string;
  nome: string;
  sobrenome: string | null;
  clinica_id: string | null;
  ativo?: boolean | null;
  bloqueio_chat?: boolean | null;
  bloqueio_agendamento?: boolean | null;
}

interface RoleContextType {
  cadastros: Cadastro[];
  activeRole: RoleType | null;
  activeCadastro: Cadastro | null;
  loading: boolean;
  switchRole: (role: RoleType) => void;
  refetchCadastros: () => Promise<void>;
}

const VALID_ROLES: RoleType[] = ["admin", "medico", "paciente", "proprietario", "funcionario"];

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [activeRole, setActiveRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCadastros = useCallback(async (setInitialRole = true, showLoading = true) => {
    if (!user) return;

    if (setInitialRole && showLoading) setLoading(true);

    const { data, error } = await supabase
      .from("cadastros")
      .select("id, cargo, nome, sobrenome, clinica_id, ativo, bloqueio_chat, bloqueio_agendamento")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching cadastros:", error);
      setLoading(false);
      return;
    }

    const validCadastros = (data || []).filter(
      (c) => c.cargo && VALID_ROLES.includes(c.cargo as RoleType) && c.ativo !== false
    );

    // For proprietário cadastros without clinica_id, resolve from clinicas table
    for (const cadastro of validCadastros) {
      if (cadastro.cargo === "proprietario" && !cadastro.clinica_id) {
        const { data: clinicaData } = await supabase
          .from("clinicas")
          .select("id")
          .eq("user_responsavel", user.id)
          .maybeSingle();
        if (clinicaData) {
          cadastro.clinica_id = clinicaData.id;
          // Also persist this so future loads are instant
          await supabase
            .from("cadastros")
            .update({ clinica_id: clinicaData.id })
            .eq("id", cadastro.id);
        }
      }
    }

    setCadastros(validCadastros);

    if (setInitialRole) {
      // Check profile for last used cadastro
      const { data: profile } = await supabase
        .from("profiles")
        .select("ultimo_cadastro_id")
        .eq("id", user.id)
        .single();

      const lastCadastro = validCadastros.find(
        (c) => c.id === profile?.ultimo_cadastro_id
      );

      if (lastCadastro && lastCadastro.cargo) {
        setActiveRole(lastCadastro.cargo as RoleType);
      } else if (validCadastros.length > 0 && validCadastros[0].cargo) {
        setActiveRole(validCadastros[0].cargo as RoleType);
      }
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCadastros([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }
    fetchCadastros(true);
  }, [user, fetchCadastros]);

  const refetchCadastros = useCallback(async () => {
    await fetchCadastros(true, false);
  }, [fetchCadastros]);

  const switchRole = async (role: RoleType) => {
    setActiveRole(role);
    const cadastro = cadastros.find((c) => c.cargo === role);
    if (cadastro && user) {
      await supabase
        .from("profiles")
        .update({ ultimo_cadastro_id: cadastro.id })
        .eq("id", user.id);
    }
  };

  const activeCadastro =
    cadastros.find((c) => c.cargo === activeRole) || null;

  return (
    <RoleContext.Provider
      value={{ cadastros, activeRole, activeCadastro, loading, switchRole, refetchCadastros }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error("useRole must be used within RoleProvider");
  return context;
};
