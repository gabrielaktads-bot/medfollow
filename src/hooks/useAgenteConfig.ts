import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

export interface PerguntaResposta {
  pergunta: string;
  resposta: string;
}

export interface AgenteConfig {
  id: string;
  clinica_id: string;
  nome_agente: string;
  orientacoes: string | null;
  palavras_criticas: string[];
  perguntas_respostas: PerguntaResposta[];
  contato_emergencia: string | null;
  temperatura: number;
  created_at: string;
  updated_at: string;
}

export interface AgenteConfigFormData {
  nome_agente: string;
  orientacoes: string;
  palavras_criticas: string[];
  perguntas_respostas: PerguntaResposta[];
  contato_emergencia: string;
  temperatura: number;
}

export const useAgenteConfig = () => {
  const { activeCadastro } = useRole();
  const queryClient = useQueryClient();
  const clinicaId = activeCadastro?.clinica_id;

  const configQuery = useQuery({
    queryKey: ["agente_config", clinicaId],
    queryFn: async () => {
      if (!clinicaId) return null;
      const { data, error } = await supabase
        .from("agente_config")
        .select("*")
        .eq("clinica_id", clinicaId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        perguntas_respostas: (data.perguntas_respostas as unknown as PerguntaResposta[]) || [],
      } as AgenteConfig;
    },
    enabled: !!clinicaId,
  });

  const upsertConfig = useMutation({
    mutationFn: async (formData: AgenteConfigFormData) => {
      if (!clinicaId) throw new Error("Clínica não encontrada");

      const existing = configQuery.data;
      if (existing) {
        const { error } = await supabase
          .from("agente_config")
          .update({
            nome_agente: formData.nome_agente,
            orientacoes: formData.orientacoes || null,
            palavras_criticas: formData.palavras_criticas,
            perguntas_respostas: formData.perguntas_respostas as unknown as string,
            contato_emergencia: formData.contato_emergencia || null,
            temperatura: formData.temperatura,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("agente_config")
          .insert({
            clinica_id: clinicaId,
            nome_agente: formData.nome_agente,
            orientacoes: formData.orientacoes || null,
            palavras_criticas: formData.palavras_criticas,
            perguntas_respostas: formData.perguntas_respostas as unknown as string,
            contato_emergencia: formData.contato_emergencia || null,
            temperatura: formData.temperatura,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agente_config"] });
      toast({ title: "Configuração do agente salva com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao salvar configuração", description: error.message, variant: "destructive" });
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    upsertConfig,
  };
};
