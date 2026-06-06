
-- 1. Planos (no dependencies)
CREATE TABLE public.planos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_do_plano TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  numero_de_usuarios INTEGER DEFAULT 0,
  quantidade_de_pacientes INTEGER DEFAULT 0,
  valor_mensal NUMERIC(10,2) DEFAULT 0,
  valor_anual NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Clinicas
CREATE TABLE public.clinicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativa BOOLEAN NOT NULL DEFAULT true,
  bairro TEXT,
  cep TEXT,
  cidade TEXT,
  cnpj TEXT,
  complemento TEXT,
  conselho_responsavel TEXT,
  email_da_clinica TEXT,
  estado TEXT,
  foto TEXT,
  funcionarios UUID[] DEFAULT '{}',
  informacoes_adicionais TEXT,
  medicos UUID[] DEFAULT '{}',
  nome_da_clinica TEXT NOT NULL,
  nome_do_responsavel TEXT,
  notificacoes UUID[] DEFAULT '{}',
  numero_da_rua TEXT,
  pacientes UUID[] DEFAULT '{}',
  plano_id UUID REFERENCES public.planos(id),
  rua TEXT,
  telefone TEXT,
  user_responsavel UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Cadastros
CREATE TABLE public.cadastros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bairro TEXT,
  cargo TEXT,
  cep TEXT,
  cidade TEXT,
  clinica_id UUID REFERENCES public.clinicas(id),
  complemento TEXT,
  conselho TEXT,
  data_de_nascimento DATE,
  diagnosticos UUID[] DEFAULT '{}',
  especialidades TEXT,
  estado TEXT,
  foto TEXT,
  genero TEXT,
  informacoes_adicionais TEXT,
  medicos UUID[] DEFAULT '{}',
  nome TEXT NOT NULL,
  notificacoes UUID[] DEFAULT '{}',
  numero_da_rua TEXT,
  pacientes UUID[] DEFAULT '{}',
  rua TEXT,
  sobrenome TEXT,
  telefone TEXT,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Profiles (linked to auth.users, stores last active cadastro)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nome TEXT,
  ultimo_cadastro_id UUID REFERENCES public.cadastros(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Notificacoes
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conteudo TEXT,
  data_de_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  medico_id UUID REFERENCES public.cadastros(id),
  paciente_id UUID REFERENCES public.cadastros(id),
  prioridade TEXT,
  status TEXT DEFAULT 'pendente',
  tipo TEXT,
  urgencia TEXT,
  vista BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Diagnosticos
CREATE TABLE public.diagnosticos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES public.clinicas(id),
  data DATE,
  medico_id UUID REFERENCES public.cadastros(id),
  paciente_id UUID REFERENCES public.cadastros(id),
  receita_passada TEXT,
  ultima_avaliacao_completo TEXT,
  ultima_avaliacao_resumo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Fluxos
CREATE TABLE public.fluxos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES public.clinicas(id),
  descricao TEXT,
  titulo TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Agendamentos
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id UUID REFERENCES public.clinicas(id),
  data DATE,
  data_do_agendamento DATE,
  medico_id UUID REFERENCES public.cadastros(id),
  paciente_id UUID REFERENCES public.cadastros(id),
  informacoes_adicionais TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cadastros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read/update their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Cadastros: users can manage their own
CREATE POLICY "Users can view own cadastros" ON public.cadastros FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cadastros" ON public.cadastros FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cadastros" ON public.cadastros FOR UPDATE USING (auth.uid() = user_id);

-- Clinicas: responsavel can manage, others can read if active
CREATE POLICY "Responsavel can manage clinica" ON public.clinicas FOR ALL USING (auth.uid() = user_responsavel);
CREATE POLICY "Authenticated can view active clinicas" ON public.clinicas FOR SELECT TO authenticated USING (ativa = true);

-- Planos: everyone can read
CREATE POLICY "Anyone can view planos" ON public.planos FOR SELECT TO authenticated USING (true);

-- Agendamentos: participants can view
CREATE POLICY "Participants can view agendamentos" ON public.agendamentos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cadastros WHERE id = medico_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.cadastros WHERE id = paciente_id AND user_id = auth.uid())
);
CREATE POLICY "Authenticated can insert agendamentos" ON public.agendamentos FOR INSERT TO authenticated WITH CHECK (true);

-- Notificacoes: participants can view
CREATE POLICY "Participants can view notificacoes" ON public.notificacoes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cadastros WHERE id = medico_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.cadastros WHERE id = paciente_id AND user_id = auth.uid())
);

-- Diagnosticos: participants can view
CREATE POLICY "Participants can view diagnosticos" ON public.diagnosticos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.cadastros WHERE id = medico_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.cadastros WHERE id = paciente_id AND user_id = auth.uid())
);

-- Fluxos: authenticated can view
CREATE POLICY "Authenticated can view fluxos" ON public.fluxos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert fluxos" ON public.fluxos FOR INSERT TO authenticated WITH CHECK (true);
