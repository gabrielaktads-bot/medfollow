-- Delete existing plans data
DELETE FROM planos;

-- Rename quantidade_de_pacientes to limite_agendamentos_mensal
ALTER TABLE planos RENAME COLUMN quantidade_de_pacientes TO limite_agendamentos_mensal;

-- Add stripe_price_id and stripe_product_id columns to planos
ALTER TABLE planos ADD COLUMN stripe_price_id text;
ALTER TABLE planos ADD COLUMN stripe_product_id text;