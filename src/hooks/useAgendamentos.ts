import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

export interface Agendamento {
  id: string;
  data: string | null;
  data_do_agendamento: string | null;
  informacoes_adicionais: string | null;
  medico_id: string | null;
  paciente_id: string | null;
  clinica_id: string | null;
  created_at: string;
  medico_nome?: string;
  paciente_nome?: string;
}

export interface AgendamentoFormData {
  data_do_agendamento: string;
  hora?: string;
  hora_fim?: string;
  paciente_id?: string | null;
  medico_id?: string;
  informacoes_adicionais?: string;
  tipo?: "consulta" | "bloqueio";
}

export const useAgendamentos = () => {
  const { activeCadastro, activeRole } = useRole();
  const queryClient = useQueryClient();
  const cadastroId = activeCadastro?.id;
  const clinicaId = activeCadastro?.clinica_id;
  const isClinicRole = activeRole === "proprietario" || activeRole === "funcionario";
  const isAdmin = activeRole === "admin";

  const query = useQuery({
    queryKey: ["agendamentos", cadastroId, clinicaId, activeRole],
    queryFn: async (): Promise<Agendamento[]> => {
      let q = supabase.from("agendamentos").select("*");

      if (isAdmin) {
        // admin sees all
      } else if (isClinicRole && clinicaId) {
        q = q.eq("clinica_id", clinicaId);
      } else if (cadastroId) {
        q = q.eq("medico_id", cadastroId);
      } else {
        return [];
      }

      const { data, error } = await q.order("data_do_agendamento", { ascending: true });
      if (error) throw error;

      // Fetch names for medicos and pacientes
      const ids = new Set<string>();
      (data || []).forEach((a) => {
        if (a.medico_id) ids.add(a.medico_id);
        if (a.paciente_id) ids.add(a.paciente_id);
      });

      let namesMap: Record<string, string> = {};
      if (ids.size > 0) {
        const { data: cadastros } = await supabase
          .from("cadastros")
          .select("id, nome, sobrenome")
          .in("id", Array.from(ids));
        (cadastros || []).forEach((c) => {
          namesMap[c.id] = `${c.nome}${c.sobrenome ? " " + c.sobrenome : ""}`;
        });
      }

      return (data || []).map((a) => ({
        ...a,
        medico_nome: a.medico_id ? namesMap[a.medico_id] || "—" : "—",
        paciente_nome: a.paciente_id ? namesMap[a.paciente_id] || "—" : "—",
      }));
    },
    enabled: !!cadastroId || isAdmin,
  });

  const createAgendamento = useMutation({
    mutationFn: async (form: AgendamentoFormData) => {
      if (!cadastroId && !isAdmin) throw new Error("Cadastro ativo não encontrado");
      const { error } = await supabase.from("agendamentos").insert({
        data_do_agendamento: form.data_do_agendamento,
        data: form.data_do_agendamento,
        hora: form.hora || null,
        paciente_id: form.paciente_id || null,
        medico_id: form.medico_id || (isClinicRole ? null : cadastroId),
        clinica_id: clinicaId || null,
        informacoes_adicionais: form.informacoes_adicionais || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast({ title: "Agendamento criado com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao criar agendamento", description: e.message, variant: "destructive" }),
  });

  const updateAgendamento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AgendamentoFormData> & { id: string }) => {
      const payload: Record<string, unknown> = {};
      if (updates.data_do_agendamento !== undefined) {
        payload.data_do_agendamento = updates.data_do_agendamento;
        payload.data = updates.data_do_agendamento;
      }
      if (updates.hora !== undefined) payload.hora = updates.hora || null;
      if (updates.paciente_id !== undefined) payload.paciente_id = updates.paciente_id;
      if (updates.medico_id !== undefined) payload.medico_id = updates.medico_id || null;
      if (updates.informacoes_adicionais !== undefined) payload.informacoes_adicionais = updates.informacoes_adicionais || null;
      const { error } = await supabase.from("agendamentos").update(payload as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast({ title: "Agendamento atualizado com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao atualizar agendamento", description: e.message, variant: "destructive" }),
  });

  const deleteAgendamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("agendamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
      toast({ title: "Agendamento removido" });
    },
    onError: (e) => toast({ title: "Erro ao remover agendamento", description: e.message, variant: "destructive" }),
  });

  return {
    agendamentos: query.data || [],
    isLoading: query.isLoading,
    createAgendamento,
    updateAgendamento,
    deleteAgendamento,
  };
};
