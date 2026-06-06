
DROP POLICY IF EXISTS "Insert cadastros" ON public.cadastros;

CREATE POLICY "Insert cadastros"
ON public.cadastros
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR (
    (cargo = 'paciente' OR cargo = 'medico' OR cargo = 'funcionario')
    AND (
      has_cargo(auth.uid(), 'proprietario')
      OR has_cargo(auth.uid(), 'admin')
      OR has_cargo(auth.uid(), 'funcionario')
      OR has_cargo(auth.uid(), 'medico')
    )
  )
);
