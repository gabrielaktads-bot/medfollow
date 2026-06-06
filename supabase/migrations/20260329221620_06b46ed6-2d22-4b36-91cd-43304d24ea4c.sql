
CREATE POLICY "Clinic staff can update notificacoes"
ON public.notificacoes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cadastros c
    WHERE (c.id = notificacoes.medico_id OR c.id = notificacoes.paciente_id)
    AND c.clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  )
);
