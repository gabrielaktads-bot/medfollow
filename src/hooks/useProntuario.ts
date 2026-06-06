import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

export interface ProntuarioEntrada {
  id: string;
  paciente_id: string;
  medico_id: string | null;
  clinica_id: string | null;
  tipo: string;
  titulo: string;
  conteudo: string;
  created_at: string;
  medico_nome?: string;
}

export interface NovaProntuarioEntrada {
  paciente_id: string;
  tipo: string;
  titulo: string;
  conteudo: string;
}

export interface NovoDiagnostico {
  paciente_id: string;
  data: string;
  ultima_avaliacao_resumo: string;
  ultima_avaliacao_completo?: string;
  receita_passada?: string;
}

export interface NovoArquivo {
  paciente_id: string;
  nome_arquivo: string;
  url: string;
  tipo?: string;
  descricao?: string;
  compartilhado_com_paciente: boolean;
}

export interface NovoDocumentoCompartilhado {
  paciente_id: string;
  tipo: string;
  referencia_id?: string;
  titulo: string;
  conteudo?: string;
}

export const useProntuario = (pacienteId: string | undefined) => {
  const { activeCadastro } = useRole();
  const queryClient = useQueryClient();
  const clinicaId = activeCadastro?.clinica_id;
  const medicoId = activeCadastro?.id;

  const entradasQuery = useQuery({
    queryKey: ["prontuario", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("prontuario_entradas")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProntuarioEntrada[];
    },
    enabled: !!pacienteId,
  });

  const agendamentosQuery = useQuery({
    queryKey: ["prontuario-agendamentos", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data_do_agendamento", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pacienteId,
  });

  const diagnosticosQuery = useQuery({
    queryKey: ["prontuario-diagnosticos", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("diagnosticos")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pacienteId,
  });

  const arquivosQuery = useQuery({
    queryKey: ["prontuario-arquivos", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("arquivos_paciente" as any)
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!pacienteId,
  });

  const docsCompartilhadosQuery = useQuery({
    queryKey: ["prontuario-docs-compartilhados", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("documentos_compartilhados" as any)
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!pacienteId,
  });

  const chatHistoryQuery = useQuery({
    queryKey: ["prontuario-chat", pacienteId],
    queryFn: async () => {
      if (!pacienteId) return [];
      const { data, error } = await supabase
        .from("mensagens_chat")
        .select("id, role, conteudo, created_at")
        .eq("paciente_id", pacienteId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!pacienteId,
  });

  const addEntrada = useMutation({
    mutationFn: async (entrada: NovaProntuarioEntrada) => {
      const { error } = await supabase
        .from("prontuario_entradas")
        .insert({
          paciente_id: entrada.paciente_id,
          medico_id: medicoId || null,
          clinica_id: clinicaId || null,
          tipo: entrada.tipo,
          titulo: entrada.titulo,
          conteudo: entrada.conteudo,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario", pacienteId] });
      toast({ title: "Entrada adicionada ao prontuário" });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar entrada", description: error.message, variant: "destructive" });
    },
  });

  const addDiagnostico = useMutation({
    mutationFn: async (d: NovoDiagnostico) => {
      const { data, error } = await supabase
        .from("diagnosticos")
        .insert({
          paciente_id: d.paciente_id,
          medico_id: medicoId || null,
          clinica_id: clinicaId || null,
          data: d.data,
          ultima_avaliacao_resumo: d.ultima_avaliacao_resumo,
          ultima_avaliacao_completo: d.ultima_avaliacao_completo || null,
          receita_passada: d.receita_passada || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario-diagnosticos", pacienteId] });
      toast({ title: "Diagnóstico registrado" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar diagnóstico", description: error.message, variant: "destructive" });
    },
  });

  const addArquivo = useMutation({
    mutationFn: async (a: NovoArquivo) => {
      const { error } = await supabase
        .from("arquivos_paciente" as any)
        .insert({
          paciente_id: a.paciente_id,
          medico_id: medicoId || null,
          clinica_id: clinicaId || null,
          nome_arquivo: a.nome_arquivo,
          url: a.url,
          tipo: a.tipo || "documento",
          descricao: a.descricao || null,
          compartilhado_com_paciente: a.compartilhado_com_paciente,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario-arquivos", pacienteId] });
      toast({ title: "Arquivo adicionado" });
    },
    onError: (error) => {
      toast({ title: "Erro ao adicionar arquivo", description: error.message, variant: "destructive" });
    },
  });

  const toggleArquivoVisibilidade = useMutation({
    mutationFn: async ({ id, compartilhado }: { id: string; compartilhado: boolean }) => {
      const { error } = await supabase
        .from("arquivos_paciente" as any)
        .update({ compartilhado_com_paciente: compartilhado } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario-arquivos", pacienteId] });
      toast({ title: "Visibilidade do arquivo atualizada" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar arquivo", description: error.message, variant: "destructive" });
    },
  });

  const addDocumentoCompartilhado = useMutation({
    mutationFn: async (d: NovoDocumentoCompartilhado) => {
      const { data, error } = await supabase
        .from("documentos_compartilhados" as any)
        .insert({
          paciente_id: d.paciente_id,
          medico_id: medicoId || null,
          clinica_id: clinicaId || null,
          tipo: d.tipo,
          referencia_id: d.referencia_id || null,
          titulo: d.titulo,
          conteudo: d.conteudo || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prontuario-docs-compartilhados", pacienteId] });
      toast({ title: "Documento compartilhado criado" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar documento", description: error.message, variant: "destructive" });
    },
  });

  return {
    entradas: entradasQuery.data || [],
    agendamentos: agendamentosQuery.data || [],
    diagnosticos: diagnosticosQuery.data || [],
    arquivos: arquivosQuery.data || [],
    docsCompartilhados: docsCompartilhadosQuery.data || [],
    chatHistory: chatHistoryQuery.data || [],
    isLoading: entradasQuery.isLoading || agendamentosQuery.isLoading || diagnosticosQuery.isLoading,
    addEntrada,
    addDiagnostico,
    addArquivo,
    toggleArquivoVisibilidade,
    addDocumentoCompartilhado,
  };
};
