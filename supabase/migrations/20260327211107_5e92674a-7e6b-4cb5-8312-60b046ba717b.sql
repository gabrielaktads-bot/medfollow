CREATE TABLE public.prontuario_entradas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.cadastros(id) ON DELETE CASCADE,
  medico_id uuid REFERENCES public.cadastros(id),
  clinica_id uuid REFERENCES public.clinicas(id),
  tipo text NOT NULL DEFAULT 'nota',
  titulo text NOT NULL,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prontuario_entradas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can view prontuario"
ON public.prontuario_entradas FOR SELECT TO authenticated
USING (
  clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  OR has_cargo(auth.uid(), 'admin')
);

CREATE POLICY "Staff can insert prontuario"
ON public.prontuario_entradas FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM cadastros c WHERE c.id = prontuario_entradas.medico_id AND c.user_id = auth.uid())
  OR clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
);

CREATE POLICY "Paciente can view own prontuario"
ON public.prontuario_entradas FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros WHERE cadastros.id = prontuario_entradas.paciente_id AND cadastros.user_id = auth.uid())
);