-- 1. Security definer function to check cargo
CREATE OR REPLACE FUNCTION public.has_cargo(_user_id uuid, _cargo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cadastros
    WHERE user_id = _user_id AND cargo = _cargo
  )
$$;

-- 2. Add 'ativo' column to cadastros for pause/reactivate
ALTER TABLE cadastros ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;

-- 3. Allow null user_id on cadastros (patients created by staff won't have accounts)
ALTER TABLE cadastros ALTER COLUMN user_id DROP NOT NULL;

-- 4. Policy: staff can view patients in same clinic or in their patients list
CREATE POLICY "Staff can view related cadastros"
ON public.cadastros
FOR SELECT
TO authenticated
USING (
  (clinica_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cadastros c
    WHERE c.user_id = auth.uid() AND c.clinica_id = cadastros.clinica_id
  ))
  OR
  (EXISTS (
    SELECT 1 FROM cadastros c
    WHERE c.user_id = auth.uid() AND cadastros.id = ANY(c.pacientes)
  ))
  OR
  (public.has_cargo(auth.uid(), 'admin'))
);

-- 5. Policy: staff can insert patient cadastros
CREATE POLICY "Staff can insert patient cadastros"
ON public.cadastros
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR
  (cargo = 'paciente' AND (
    public.has_cargo(auth.uid(), 'medico')
    OR public.has_cargo(auth.uid(), 'proprietario')
    OR public.has_cargo(auth.uid(), 'funcionario')
    OR public.has_cargo(auth.uid(), 'admin')
  ))
);

-- 6. Policy: staff can update related patient cadastros
CREATE POLICY "Staff can update related cadastros"
ON public.cadastros
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = user_id)
  OR
  (cargo = 'paciente' AND clinica_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM cadastros c
    WHERE c.user_id = auth.uid() AND c.clinica_id = cadastros.clinica_id
  ))
  OR
  (EXISTS (
    SELECT 1 FROM cadastros c
    WHERE c.user_id = auth.uid() AND cadastros.id = ANY(c.pacientes)
  ))
  OR
  (public.has_cargo(auth.uid(), 'admin'))
);