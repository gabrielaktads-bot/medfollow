
-- Fix permissive INSERT on fluxos
DROP POLICY IF EXISTS "Clinica users can insert fluxos" ON public.fluxos;
CREATE POLICY "Clinica users can insert fluxos" ON public.fluxos FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.cadastros c WHERE c.clinica_id = fluxos.clinica_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.clinicas cl WHERE cl.id = fluxos.clinica_id AND cl.user_responsavel = auth.uid())
);
