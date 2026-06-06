ALTER TABLE public.agente_config
  ADD COLUMN perguntas_respostas jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN contato_emergencia text;