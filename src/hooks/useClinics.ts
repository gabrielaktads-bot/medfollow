import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface HorarioAtendimento {
  dia: string;
  inicio: string;
  fim: string;
  ativo: boolean;
}

export interface Clinica {
  id: string;
  nome_da_clinica: string;
  email_da_clinica: string | null;
  telefone: string | null;
  cnpj: string | null;
  ativa: boolean;
  created_at: string;
  cidade: string | null;
  estado: string | null;
  bairro: string | null;
  cep: string | null;
  complemento: string | null;
  conselho_responsavel: string | null;
  foto: string | null;
  funcionarios: string[] | null;
  horarios_atendimento: HorarioAtendimento[] | null;
  informacoes_adicionais: string | null;
  medicos: string[] | null;
  nome_do_responsavel: string | null;
  notificacoes: string[] | null;
  numero_da_rua: string | null;
  pacientes: string[] | null;
  plano_id: string | null;
  rua: string | null;
  user_responsavel: string | null;
}

export interface ClinicaFormData {
  nome_da_clinica: string;
  email_da_clinica?: string;
  telefone?: string;
  cnpj?: string;
  ativa?: boolean;
  cidade?: string;
  estado?: string;
  bairro?: string;
  cep?: string;
  complemento?: string;
  conselho_responsavel?: string;
  foto?: string;
  funcionarios?: string[];
  horarios_atendimento?: HorarioAtendimento[];
  informacoes_adicionais?: string;
  medicos?: string[];
  nome_do_responsavel?: string;
  notificacoes?: string[];
  numero_da_rua?: string;
  pacientes?: string[];
  plano_id?: string;
  rua?: string;
  user_responsavel?: string;
}

export const useClinics = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["clinicas"],
    queryFn: async (): Promise<Clinica[]> => {
      const { data, error } = await supabase
        .from("clinicas")
        .select("*")
        .order("nome_da_clinica");
      if (error) throw error;
      return (data || []).map((d: any) => ({
        ...d,
        horarios_atendimento: d.horarios_atendimento as HorarioAtendimento[] | null,
      })) as Clinica[];
    },
  });

  const createClinica = useMutation({
    mutationFn: async (form: ClinicaFormData) => {
      const { error } = await supabase.from("clinicas").insert({
        nome_da_clinica: form.nome_da_clinica,
        email_da_clinica: form.email_da_clinica || null,
        telefone: form.telefone || null,
        cnpj: form.cnpj || null,
        ativa: form.ativa ?? true,
        cidade: form.cidade || null,
        estado: form.estado || null,
        bairro: form.bairro || null,
        cep: form.cep || null,
        complemento: form.complemento || null,
        conselho_responsavel: form.conselho_responsavel || null,
        foto: form.foto || null,
        funcionarios: form.funcionarios || [],
        horarios_atendimento: (form.horarios_atendimento || null) as any,
        informacoes_adicionais: form.informacoes_adicionais || null,
        medicos: form.medicos || [],
        nome_do_responsavel: form.nome_do_responsavel || null,
        notificacoes: form.notificacoes || [],
        numero_da_rua: form.numero_da_rua || null,
        pacientes: form.pacientes || [],
        plano_id: form.plano_id || null,
        rua: form.rua || null,
        user_responsavel: form.user_responsavel || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicas"] });
      toast({ title: "Clínica criada com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao criar clínica", description: e.message, variant: "destructive" }),
  });

  const updateClinica = useMutation({
    mutationFn: async ({ id, ...form }: ClinicaFormData & { id: string }) => {
      const { error } = await supabase.from("clinicas").update({
        nome_da_clinica: form.nome_da_clinica,
        email_da_clinica: form.email_da_clinica || null,
        telefone: form.telefone || null,
        cnpj: form.cnpj || null,
        ativa: form.ativa ?? true,
        cidade: form.cidade || null,
        estado: form.estado || null,
        bairro: form.bairro || null,
        cep: form.cep || null,
        complemento: form.complemento || null,
        conselho_responsavel: form.conselho_responsavel || null,
        foto: form.foto || null,
        funcionarios: form.funcionarios || [],
        horarios_atendimento: (form.horarios_atendimento || null) as any,
        informacoes_adicionais: form.informacoes_adicionais || null,
        medicos: form.medicos || [],
        nome_do_responsavel: form.nome_do_responsavel || null,
        notificacoes: form.notificacoes || [],
        numero_da_rua: form.numero_da_rua || null,
        pacientes: form.pacientes || [],
        plano_id: form.plano_id || null,
        rua: form.rua || null,
        user_responsavel: form.user_responsavel || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicas"] });
      toast({ title: "Clínica atualizada com sucesso" });
    },
    onError: (e) => toast({ title: "Erro ao atualizar clínica", description: e.message, variant: "destructive" }),
  });

  const toggleAtiva = useMutation({
    mutationFn: async ({ id, ativa }: { id: string; ativa: boolean }) => {
      const { error } = await supabase.from("clinicas").update({ ativa }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicas"] });
      toast({ title: "Status da clínica atualizado" });
    },
    onError: (e) => toast({ title: "Erro ao atualizar status", description: e.message, variant: "destructive" }),
  });

  const deleteClinica = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinicas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinicas"] });
      toast({ title: "Clínica removida" });
    },
    onError: (e) => toast({ title: "Erro ao remover clínica", description: e.message, variant: "destructive" }),
  });

  return {
    clinicas: query.data || [],
    isLoading: query.isLoading,
    createClinica,
    updateClinica,
    toggleAtiva,
    deleteClinica,
  };
};
