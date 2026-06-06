
-- Table: agente_config
CREATE TABLE public.agente_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
  nome_agente text NOT NULL DEFAULT 'Assistente de Saúde',
  orientacoes text,
  palavras_criticas text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clinica_id)
);

ALTER TABLE public.agente_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view agente_config"
  ON public.agente_config FOR SELECT TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Clinic staff can insert agente_config"
  ON public.agente_config FOR INSERT TO authenticated
  WITH CHECK (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Clinic staff can update agente_config"
  ON public.agente_config FOR UPDATE TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

-- Table: mensagens_chat
CREATE TABLE public.mensagens_chat (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id uuid REFERENCES public.clinicas(id) ON DELETE SET NULL,
  paciente_id uuid NOT NULL REFERENCES public.cadastros(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensagens_chat ENABLE ROW LEVEL SECURITY;

-- Paciente can view own messages
CREATE POLICY "Paciente can view own messages"
  ON public.mensagens_chat FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cadastros WHERE cadastros.id = mensagens_chat.paciente_id AND cadastros.user_id = auth.uid()
  ));

-- Clinic staff can view messages of their clinic's patients
CREATE POLICY "Clinic staff can view messages"
  ON public.mensagens_chat FOR SELECT TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

-- Paciente can insert own messages (user role only)
CREATE POLICY "Paciente can insert own messages"
  ON public.mensagens_chat FOR INSERT TO authenticated
  WITH CHECK (
    role = 'user' AND EXISTS (
      SELECT 1 FROM cadastros WHERE cadastros.id = mensagens_chat.paciente_id AND cadastros.user_id = auth.uid()
    )
  );

-- Allow service_role to insert (for edge function inserting assistant messages)
-- service_role bypasses RLS by default, no policy needed

-- Also allow reading agente_config for patients (so edge function with user token can read it)
CREATE POLICY "Paciente can read own clinic agente_config"
  ON public.agente_config FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cadastros WHERE cadastros.clinica_id = agente_config.clinica_id AND cadastros.user_id = auth.uid()
  ));
