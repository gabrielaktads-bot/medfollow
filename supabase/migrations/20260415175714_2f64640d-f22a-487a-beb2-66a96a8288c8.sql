CREATE POLICY "Clinic staff can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT c.user_id FROM cadastros c
    WHERE c.user_id IS NOT NULL
      AND c.clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  )
);