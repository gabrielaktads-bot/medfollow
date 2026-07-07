import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

export interface Doctor {
  id: string;
  nome: string;
  sobrenome: string | null;
  especialidades: string | null;
  conselho: string | null;
  telefone: string | null;
  ativo: boolean;
  pacientes: string[] | null;
  user_id: string | null;
}

export const useDoctors = () => {
  const { activeCadastro } = useRole();
  const { user } = useAuth();
  const clinicaId = activeCadastro?.clinica_id;

  const query = useQuery({
    queryKey: ["doctors", clinicaId, user?.id],
    queryFn: async (): Promise<Doctor[]> => {
      let resolvedClinicaId = clinicaId;

      // Fallback: resolve clinica_id from clinicas table for proprietario
      if (!resolvedClinicaId && user?.id) {
        const { data: clinicaData } = await supabase
          .from("clinicas")
          .select("id")
          .eq("user_responsavel", user.id)
          .maybeSingle();
        resolvedClinicaId = clinicaData?.id || null;
      }

      if (!resolvedClinicaId) return [];

      const { data, error } = await supabase
        .from("cadastros")
        .select("id, nome, sobrenome, especialidades, conselho, telefone, ativo, pacientes, user_id")
        .eq("cargo", "medico")
        .eq("clinica_id", resolvedClinicaId)
        .order("nome");
      if (error) throw error;
      return (data || []) as Doctor[];
    },
    enabled: !!(clinicaId || user?.id),
  });

  return { doctors: query.data || [], isLoading: query.isLoading };
};
