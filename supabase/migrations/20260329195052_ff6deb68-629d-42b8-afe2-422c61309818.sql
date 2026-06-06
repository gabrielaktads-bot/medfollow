
-- Table for patient file uploads
CREATE TABLE public.arquivos_paciente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  clinica_id uuid,
  medico_id uuid,
  nome_arquivo text NOT NULL,
  url text NOT NULL,
  tipo text DEFAULT 'documento',
  compartilhado_com_paciente boolean DEFAULT false,
  descricao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.arquivos_paciente ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view files" ON public.arquivos_paciente
  FOR SELECT TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Patient can view shared files" ON public.arquivos_paciente
  FOR SELECT TO authenticated
  USING (compartilhado_com_paciente = true AND EXISTS (
    SELECT 1 FROM cadastros WHERE cadastros.id = arquivos_paciente.paciente_id AND cadastros.user_id = auth.uid()
  ));

CREATE POLICY "Staff can insert files" ON public.arquivos_paciente
  FOR INSERT TO authenticated
  WITH CHECK (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR EXISTS (
    SELECT 1 FROM cadastros c WHERE c.id = arquivos_paciente.medico_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Staff can update files" ON public.arquivos_paciente
  FOR UPDATE TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR EXISTS (
    SELECT 1 FROM cadastros c WHERE c.id = arquivos_paciente.medico_id AND c.user_id = auth.uid()
  ));

-- Table for shareable procedure/document links
CREATE TABLE public.documentos_compartilhados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL,
  clinica_id uuid,
  medico_id uuid,
  tipo text NOT NULL,
  referencia_id uuid,
  titulo text NOT NULL,
  conteudo text,
  link_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.documentos_compartilhados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can manage docs" ON public.documentos_compartilhados
  FOR ALL TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Patient can view own docs" ON public.documentos_compartilhados
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM cadastros WHERE cadastros.id = documentos_compartilhados.paciente_id AND cadastros.user_id = auth.uid()
  ));

CREATE POLICY "Staff can insert docs" ON public.documentos_compartilhados
  FOR INSERT TO authenticated
  WITH CHECK (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'medico'));

CREATE POLICY "Public can read by token" ON public.documentos_compartilhados
  FOR SELECT TO anon
  USING (link_token IS NOT NULL);

-- Storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos-paciente', 'documentos-paciente', true);

CREATE POLICY "Authenticated can upload patient docs" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos-paciente');

CREATE POLICY "Anyone can read patient docs" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'documentos-paciente');

-- Missing: Clinic staff need to view and insert diagnosticos
CREATE POLICY "Clinic staff can view diagnosticos" ON public.diagnosticos
  FOR SELECT TO authenticated
  USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Clinic staff can insert diagnosticos" ON public.diagnosticos
  FOR INSERT TO authenticated
  WITH CHECK (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())));
