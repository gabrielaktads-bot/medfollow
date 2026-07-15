import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

export interface Notificacao {
  id: string;
  conteudo: string | null;
  tipo: string | null;
  urgencia: string | null;
  prioridade: string | null;
  status: string | null;
  vista: boolean;
  data_de_criacao: string;
  medico_id: string | null;
  paciente_id: string | null;
  paciente_nome?: string;
  medico_nome?: string;
}

export const useNotificacoes = () => {
  const { activeCadastro, activeRole } = useRole();
  const queryClient = useQueryClient();
  const cadastroId = activeCadastro?.id;
  const clinicaId = activeCadastro?.clinica_id;
  const isAdmin = activeRole === "admin";
  const isDoctor = activeRole === "medico";

  const query = useQuery({
    queryKey: ["notificacoes", cadastroId, activeRole, clinicaId],
    queryFn: async (): Promise<Notificacao[]> => {
      let queryBuilder = supabase
        .from("notificacoes")
        .select("*")
        .order("data_de_criacao", { ascending: false });

      // For doctors: scope to their own patients only
      if (isDoctor && cadastroId) {
        const { data: myPatients } = await supabase
          .from("cadastros")
          .select("id")
          .eq("cargo", "paciente")
          .contains("medicos", [cadastroId]);

        const myPatientIds = (myPatients || []).map((p: { id: string }) => p.id);
        if (myPatientIds.length === 0) return [];
        queryBuilder = queryBuilder.in("paciente_id", myPatientIds);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      let filtered = data || [];

      // Client-side filter for clinic roles: only show notifications for the active clinic
      if (!isAdmin && !isDoctor && clinicaId) {
        const { data: clinicCadastros } = await supabase
          .from("cadastros")
          .select("id")
          .eq("clinica_id", clinicaId);

        const clinicIds = new Set((clinicCadastros || []).map((c) => c.id));

        filtered = filtered.filter((n) => {
          return (n.paciente_id && clinicIds.has(n.paciente_id)) ||
                 (n.medico_id && clinicIds.has(n.medico_id));
        });
      }

      const ids = new Set<string>();
      filtered.forEach((n) => {
        if (n.medico_id) ids.add(n.medico_id);
        if (n.paciente_id) ids.add(n.paciente_id);
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

      return filtered.map((n) => ({
        ...n,
        paciente_nome: n.paciente_id ? namesMap[n.paciente_id] || "—" : "—",
        medico_nome: n.medico_id ? namesMap[n.medico_id] || "—" : "—",
      }));
    },
    enabled: !!cadastroId || isAdmin,
  });

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificacoes").update({ vista: true, status: "resolvido" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
    onError: (e) => toast({ title: "Erro ao resolver alerta", description: e.message, variant: "destructive" }),
  });

  const undoResolve = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificacoes").update({ vista: false, status: "pendente" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
      toast({ title: "Alerta revertido para pendente" });
    },
    onError: (e) => toast({ title: "Erro ao desfazer", description: e.message, variant: "destructive" }),
  });

  // Sort: unresolved first, then by date
  const sorted = [...(query.data || [])].sort((a, b) => {
    const aResolved = a.status === "resolvido" ? 1 : 0;
    const bResolved = b.status === "resolvido" ? 1 : 0;
    if (aResolved !== bResolved) return aResolved - bResolved;
    return new Date(b.data_de_criacao).getTime() - new Date(a.data_de_criacao).getTime();
  });

  return {
    notificacoes: sorted,
    isLoading: query.isLoading,
    markAsRead,
    undoResolve,
    unreadCount: sorted.filter((n) => n.status !== "resolvido").length,
  };
};
