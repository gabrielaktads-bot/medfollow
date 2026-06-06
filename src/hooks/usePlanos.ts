import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Plano {
  id: string;
  nome_do_plano: string;
  valor_mensal: number | null;
  valor_anual: number | null;
  numero_de_usuarios: number | null;
  limite_agendamentos_mensal: number | null;
  ativo: boolean;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
}

export interface PlanoFormData {
  nome_do_plano: string;
  valor_mensal?: number | null;
  valor_anual?: number | null;
  numero_de_usuarios?: number | null;
  limite_agendamentos_mensal?: number | null;
  stripe_price_id?: string | null;
  stripe_product_id?: string | null;
}

export const usePlanos = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["planos"],
    queryFn: async (): Promise<Plano[]> => {
      const { data, error } = await supabase.from("planos").select("*").order("nome_do_plano");
      if (error) throw error;
      return (data || []) as Plano[];
    },
  });

  const createPlano = useMutation({
    mutationFn: async (form: PlanoFormData) => {
      const { data, error } = await supabase.from("planos").insert({
        nome_do_plano: form.nome_do_plano,
        valor_mensal: form.valor_mensal ?? 0,
        valor_anual: form.valor_anual ?? 0,
        numero_de_usuarios: form.numero_de_usuarios ?? 0,
        limite_agendamentos_mensal: form.limite_agendamentos_mensal ?? 0,
        stripe_price_id: form.stripe_price_id || null,
        stripe_product_id: form.stripe_product_id || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      toast({ title: "Plano criado com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao criar plano", description: e.message, variant: "destructive" }),
  });

  const updatePlano = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: PlanoFormData }) => {
      const { error } = await supabase.from("planos").update({
        nome_do_plano: form.nome_do_plano,
        valor_mensal: form.valor_mensal ?? 0,
        valor_anual: form.valor_anual ?? 0,
        numero_de_usuarios: form.numero_de_usuarios ?? 0,
        limite_agendamentos_mensal: form.limite_agendamentos_mensal ?? 0,
        stripe_price_id: form.stripe_price_id || null,
        stripe_product_id: form.stripe_product_id || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      toast({ title: "Plano atualizado com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao atualizar plano", description: e.message, variant: "destructive" }),
  });

  const deletePlano = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("planos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planos"] });
      toast({ title: "Plano removido" });
    },
    onError: (e) => toast({ title: "Erro ao remover plano", description: e.message, variant: "destructive" }),
  });

  return { planos: query.data || [], isLoading: query.isLoading, createPlano, updatePlano, deletePlano };
};
