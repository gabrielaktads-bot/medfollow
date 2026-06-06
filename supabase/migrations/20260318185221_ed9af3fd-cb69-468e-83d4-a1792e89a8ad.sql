
-- Update the "clinica" cadastro to "proprietario"
UPDATE cadastros SET cargo = 'proprietario' WHERE cargo = 'clinica';

-- Insert funcionario and paciente cadastros for the test user
INSERT INTO cadastros (user_id, cargo, nome, sobrenome)
SELECT user_id, 'funcionario', nome, sobrenome
FROM cadastros
WHERE cargo = 'admin' AND user_id = 'd696ecf4-90b3-44ac-8367-985d83a7319d'
LIMIT 1;

INSERT INTO cadastros (user_id, cargo, nome, sobrenome)
SELECT user_id, 'paciente', nome, sobrenome
FROM cadastros
WHERE cargo = 'admin' AND user_id = 'd696ecf4-90b3-44ac-8367-985d83a7319d'
LIMIT 1;
