-- 1. Create security definer helper functions to avoid RLS recursion on cadastros
CREATE OR REPLACE FUNCTION public.get_user_clinica_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT clinica_id FROM cadastros WHERE user_id = _user_id AND clinica_id IS NOT NULL
$$;

CREATE OR REPLACE FUNCTION public.get_user_paciente_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT DISTINCT unnest(pacientes) FROM cadastros WHERE user_id = _user_id AND pacientes IS NOT NULL
$$;

-- 2. Drop ALL existing cadastros policies
DROP POLICY IF EXISTS "Users can view own cadastros" ON cadastros;
DROP POLICY IF EXISTS "Users can insert own cadastros" ON cadastros;
DROP POLICY IF EXISTS "Users can update own cadastros" ON cadastros;
DROP POLICY IF EXISTS "Staff can view related cadastros" ON cadastros;
DROP POLICY IF EXISTS "Staff can insert patient cadastros" ON cadastros;
DROP POLICY IF EXISTS "Staff can update related cadastros" ON cadastros;

-- 3. Recreate non-recursive cadastros policies
CREATE POLICY "View cadastros" ON cadastros FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR (clinica_id IS NOT NULL AND clinica_id IN (SELECT get_user_clinica_ids(auth.uid())))
  OR id IN (SELECT get_user_paciente_ids(auth.uid()))
  OR has_cargo(auth.uid(), 'admin')
);

CREATE POLICY "Insert cadastros" ON cadastros FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR (cargo = 'paciente' AND (
    has_cargo(auth.uid(), 'medico')
    OR has_cargo(auth.uid(), 'proprietario')
    OR has_cargo(auth.uid(), 'funcionario')
    OR has_cargo(auth.uid(), 'admin')
  ))
);

CREATE POLICY "Update cadastros" ON cadastros FOR UPDATE TO authenticated
USING (
  user_id = auth.uid()
  OR (cargo = 'paciente' AND clinica_id IS NOT NULL AND clinica_id IN (SELECT get_user_clinica_ids(auth.uid())))
  OR id IN (SELECT get_user_paciente_ids(auth.uid()))
  OR has_cargo(auth.uid(), 'admin')
);

-- 4. Agendamentos: clinic staff + admin + update/delete
CREATE POLICY "Clinic staff can view agendamentos" ON agendamentos FOR SELECT TO authenticated
USING (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())) OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Clinic staff can insert agendamentos" ON agendamentos FOR INSERT TO authenticated
WITH CHECK (clinica_id IN (SELECT get_user_clinica_ids(auth.uid())));

CREATE POLICY "Participants can update agendamentos" ON agendamentos FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros WHERE id = agendamentos.medico_id AND user_id = auth.uid())
  OR clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  OR has_cargo(auth.uid(), 'admin')
);

CREATE POLICY "Participants can delete agendamentos" ON agendamentos FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros WHERE id = agendamentos.medico_id AND user_id = auth.uid())
  OR clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  OR has_cargo(auth.uid(), 'admin')
);

-- 5. Notificacoes: admin + clinic staff + insert + update
CREATE POLICY "Admin can view all notificacoes" ON notificacoes FOR SELECT TO authenticated
USING (has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Clinic staff can view notificacoes" ON notificacoes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cadastros c
    WHERE (c.id = notificacoes.medico_id OR c.id = notificacoes.paciente_id)
    AND c.clinica_id IN (SELECT get_user_clinica_ids(auth.uid()))
  )
);

CREATE POLICY "Staff can insert notificacoes" ON notificacoes FOR INSERT TO authenticated
WITH CHECK (has_cargo(auth.uid(), 'medico') OR has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Participants can update notificacoes" ON notificacoes FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros WHERE id = notificacoes.medico_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM cadastros WHERE id = notificacoes.paciente_id AND user_id = auth.uid())
  OR has_cargo(auth.uid(), 'admin')
);

-- 6. Diagnosticos: insert + update
CREATE POLICY "Medicos can insert diagnosticos" ON diagnosticos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM cadastros WHERE id = diagnosticos.medico_id AND user_id = auth.uid()));

CREATE POLICY "Medicos can update diagnosticos" ON diagnosticos FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM cadastros WHERE id = diagnosticos.medico_id AND user_id = auth.uid()));

-- 7. Planos: admin CRUD
CREATE POLICY "Admin can insert planos" ON planos FOR INSERT TO authenticated
WITH CHECK (has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Admin can update planos" ON planos FOR UPDATE TO authenticated
USING (has_cargo(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete planos" ON planos FOR DELETE TO authenticated
USING (has_cargo(auth.uid(), 'admin'));

-- 8. Fluxos: UPDATE and DELETE
CREATE POLICY "Clinica users can update fluxos" ON fluxos FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros c WHERE c.clinica_id = fluxos.clinica_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM clinicas cl WHERE cl.id = fluxos.clinica_id AND cl.user_responsavel = auth.uid())
  OR has_cargo(auth.uid(), 'admin')
);

CREATE POLICY "Clinica users can delete fluxos" ON fluxos FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM cadastros c WHERE c.clinica_id = fluxos.clinica_id AND c.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM clinicas cl WHERE cl.id = fluxos.clinica_id AND cl.user_responsavel = auth.uid())
  OR has_cargo(auth.uid(), 'admin')
);

-- 9. Admin full access to clinicas
CREATE POLICY "Admin can manage clinicas" ON clinicas FOR ALL TO authenticated
USING (has_cargo(auth.uid(), 'admin'))
WITH CHECK (has_cargo(auth.uid(), 'admin'));