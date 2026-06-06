import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "@/hooks/use-toast";

export interface Fluxo {
  id: string;
  titulo: string;
  descricao: string | null;
  clinica_id: string | null;
  created_at: string;
}

export interface FluxoFormData {
  titulo: string;
  descricao?: string;
}

export const useFluxos = () => {
  const { activeCadastro, activeRole } = useRole();
  const queryClient = useQueryClient();
  const clinicaId = activeCadastro?.clinica_id;

  const query = useQuery({
    queryKey: ["fluxos", clinicaId, activeRole],
    queryFn: async (): Promise<Fluxo[]> => {
      let q = supabase.from("fluxos").select("*");
      if (clinicaId && activeRole !== "admin") {
        q = q.eq("clinica_id", clinicaId);
      }
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Fluxo[];
    },
  });

  const createFluxo = useMutation({
    mutationFn: async (form: FluxoFormData) => {
      const { error } = await supabase.from("fluxos").insert({
        titulo: form.titulo,
        descricao: form.descricao || null,
        clinica_id: clinicaId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxos"] });
      toast({ title: "Fluxo criado com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao criar fluxo", description: e.message, variant: "destructive" }),
  });

  const deleteFluxo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fluxos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fluxos"] });
      toast({ title: "Fluxo removido" });
    },
    onError: (e) => toast({ title: "Erro ao remover fluxo", description: e.message, variant: "destructive" }),
  });

  return {
    fluxos: query.data || [],
    isLoading: query.isLoading,
    createFluxo,
    deleteFluxo,
  };
};
