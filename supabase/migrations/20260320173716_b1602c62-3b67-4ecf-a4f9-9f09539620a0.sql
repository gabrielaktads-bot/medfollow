-- Remove the overly permissive fluxos INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert fluxos" ON public.fluxos;