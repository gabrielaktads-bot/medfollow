
-- Fix permissive INSERT on agendamentos
DROP POLICY IF EXISTS "Authenticated can insert agendamentos" ON public.agendamentos;
CREATE POLICY "Medico can insert agendamentos" ON public.agendamentos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.cadastros c WHERE c.id = agendamentos.medico_id AND c.user_id = auth.uid())
);
