import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Patient {
  id: string;
  nome: string;
  sobrenome: string | null;
  telefone: string | null;
  genero: string | null;
  data_de_nascimento: string | null;
  clinica_id: string | null;
  ativo: boolean;
  bloqueio_chat: boolean | null;
  bloqueio_agendamento: boolean | null;
  created_at: string;
  informacoes_adicionais: string | null;
  cargo: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  complemento: string | null;
  estado: string | null;
  foto: string | null;
  numero_da_rua: string | null;
  rua: string | null;
  medicos: string[] | null;
  user_id: string | null;
}

export interface PatientFormData {
  nome: string;
  sobrenome?: string;
  telefone?: string;
  genero?: string;
  data_de_nascimento?: string;
  informacoes_adicionais?: string;
  email?: string;
  password?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  complemento?: string;
  estado?: string;
  foto?: string;
  numero_da_rua?: string;
  rua?: string;
  medicos?: string[];
}

export const usePatients = () => {
  const { activeCadastro, activeRole, refetchCadastros } = useRole();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const clinicaId = activeCadastro?.clinica_id;
  const cadastroId = activeCadastro?.id;
  const isClinicRole = activeRole === "proprietario" || activeRole === "funcionario";

  const isMedico = activeRole === "medico";

  const patientsQuery = useQuery({
    queryKey: ["patients", cadastroId, clinicaId, isClinicRole, isMedico],
    queryFn: async () => {
      if (!cadastroId) return [];

      const selectFields = "id, nome, sobrenome, telefone, genero, data_de_nascimento, clinica_id, ativo, bloqueio_chat, bloqueio_agendamento, created_at, informacoes_adicionais, cargo, bairro, cep, cidade, complemento, estado, foto, numero_da_rua, rua, medicos, user_id";

      if (isClinicRole && clinicaId) {
        const { data, error } = await supabase
          .from("cadastros")
          .select(selectFields)
          .eq("cargo", "paciente")
          .eq("clinica_id", clinicaId)
          .order("nome");

        if (error) throw error;
        return (data || []) as Patient[];
      } else if (isMedico && clinicaId && cadastroId) {
        // Doctor: show only their own patients (medicos array contains their ID)
        const { data, error } = await supabase
          .from("cadastros")
          .select(selectFields)
          .eq("cargo", "paciente")
          .eq("clinica_id", clinicaId)
          .contains("medicos", [cadastroId])
          .order("nome");

        if (error) throw error;
        return (data || []) as Patient[];
      } else {
        const { data: myCadastro, error: meError } = await supabase
          .from("cadastros")
          .select("pacientes")
          .eq("id", cadastroId)
          .maybeSingle();

        if (meError) throw meError;
        const patientIds = (myCadastro?.pacientes as string[]) || [];
        if (patientIds.length === 0) return [];

        const { data, error } = await supabase
          .from("cadastros")
          .select(selectFields)
          .in("id", patientIds)
          .eq("cargo", "paciente")
          .order("nome");

        if (error) throw error;
        return (data || []) as Patient[];
      }
    },
    enabled: !!cadastroId,
  });

  const createPatient = useMutation({
    mutationFn: async (formData: PatientFormData) => {
      if (!cadastroId) throw new Error("cadastro ativo não encontrado");

      // Resolve clinicaId dynamically if not available
      let resolvedClinicaId = clinicaId;
      if (!resolvedClinicaId && user?.id) {
        const { data: clinicaData } = await supabase
          .from("clinicas")
          .select("id")
          .eq("user_responsavel", user.id)
          .maybeSingle();
        resolvedClinicaId = clinicaData?.id || null;
      }

      if (!resolvedClinicaId) throw new Error("Nenhuma clínica vinculada ao cadastro ativo. Verifique se o onboarding foi concluído.");

      // If email provided, find or create user
      let userId: string | null = null;
      if (formData.email?.trim()) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("find-or-create-user", {
          body: { email: formData.email.trim(), password: formData.password || undefined },
        });
        if (fnError) throw new Error("Erro ao buscar/criar usuário: " + fnError.message);
        if (fnData?.error) throw new Error(fnData.error);
        userId = fnData?.user_id || null;
      }

      // BUG-005: block duplicate patient email in same clinic (local check avoids RLS issues)
      if (userId && (patientsQuery.data || []).some((p) => p.user_id === userId)) {
        throw new Error("Já existe um paciente cadastrado com este e-mail nesta clínica.");
      }

      const { data, error } = await supabase
        .from("cadastros")
        .insert({
          nome: formData.nome,
          sobrenome: formData.sobrenome || null,
          telefone: formData.telefone || null,
          genero: formData.genero || null,
          data_de_nascimento: formData.data_de_nascimento || null,
          informacoes_adicionais: formData.informacoes_adicionais || null,
          cargo: "paciente",
          clinica_id: resolvedClinicaId || null,
          user_id: userId as unknown as string,
          ativo: true,
          bairro: formData.bairro || null,
          cep: formData.cep || null,
          cidade: formData.cidade || null,
          complemento: formData.complemento || null,
          estado: formData.estado || null,
          foto: formData.foto || null,
          numero_da_rua: formData.numero_da_rua || null,
          rua: formData.rua || null,
          medicos: formData.medicos || [],
        })
        .select("id")
        .single();

      if (error) throw error;

      // Add patient to current user's pacientes array
      if (data?.id) {
        const { data: currentCadastro } = await supabase
          .from("cadastros")
          .select("pacientes")
          .eq("id", cadastroId)
          .maybeSingle();

        const currentPatients = (currentCadastro?.pacientes as string[]) || [];
        await supabase
          .from("cadastros")
          .update({ pacientes: [...currentPatients, data.id] })
          .eq("id", cadastroId);

        // BUG-009: update each linked doctor's pacientes array
        if (formData.medicos && formData.medicos.length > 0) {
          for (const medicoId of formData.medicos) {
            const { data: doc } = await supabase
              .from("cadastros")
              .select("pacientes")
              .eq("id", medicoId)
              .maybeSingle();
            const docPacientes = (doc?.pacientes as string[]) || [];
            if (!docPacientes.includes(data.id)) {
              await supabase
                .from("cadastros")
                .update({ pacientes: [...docPacientes, data.id] })
                .eq("id", medicoId);
            }
          }
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      refetchCadastros();
      toast({ title: "Paciente cadastrado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao cadastrar paciente", description: error.message, variant: "destructive" });
    },
  });

  const updatePatient = useMutation({
    mutationFn: async ({ id, email, ...formData }: PatientFormData & { id: string }) => {
      // If email provided, find or create user
      let userId: string | null | undefined = undefined;
      if (email?.trim()) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke("find-or-create-user", {
          body: { email: email.trim() },
        });
        if (fnError) throw new Error("Erro ao buscar/criar usuário: " + fnError.message);
        if (fnData?.error) throw new Error(fnData.error);
        userId = fnData?.user_id || null;
      }

      const updateData: Record<string, unknown> = {
        nome: formData.nome,
        sobrenome: formData.sobrenome || null,
        telefone: formData.telefone || null,
        genero: formData.genero || null,
        data_de_nascimento: formData.data_de_nascimento || null,
        informacoes_adicionais: formData.informacoes_adicionais || null,
        bairro: formData.bairro || null,
        cep: formData.cep || null,
        cidade: formData.cidade || null,
        complemento: formData.complemento || null,
        estado: formData.estado || null,
        foto: formData.foto || null,
        numero_da_rua: formData.numero_da_rua || null,
        rua: formData.rua || null,
        medicos: formData.medicos || [],
      };

      if (userId !== undefined) {
        updateData.user_id = userId;
      }

      const { error } = await supabase
        .from("cadastros")
        .update(updateData as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast({ title: "Paciente atualizado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar paciente", description: error.message, variant: "destructive" });
    },
  });

  const togglePatientStatus = useMutation({
    mutationFn: async ({ id, ativo, bloqueio_chat, bloqueio_agendamento }: { id: string; ativo: boolean; bloqueio_chat: boolean; bloqueio_agendamento: boolean }) => {
      const { error } = await supabase
        .from("cadastros")
        .update({ ativo, bloqueio_chat, bloqueio_agendamento })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      const hasBlock = !variables.ativo || variables.bloqueio_chat || variables.bloqueio_agendamento;
      toast({ title: hasBlock ? "Bloqueios salvos" : "Paciente reativado" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao alterar status", description: error.message, variant: "destructive" });
    },
  });

  return {
    patients: patientsQuery.data || [],
    isLoading: patientsQuery.isLoading,
    error: patientsQuery.error,
    createPatient,
    updatePatient,
    togglePatientStatus,
  };
};
