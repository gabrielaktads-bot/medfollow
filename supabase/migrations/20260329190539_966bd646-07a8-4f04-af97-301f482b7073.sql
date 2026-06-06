CREATE POLICY "Clinic owner can insert agendamentos"
ON public.agendamentos
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clinicas
    WHERE clinicas.id = agendamentos.clinica_id
    AND clinicas.user_responsavel = auth.uid()
  )
);