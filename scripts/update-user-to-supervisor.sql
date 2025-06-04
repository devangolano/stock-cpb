-- Atualizar o usuário existente para supervisor
UPDATE funcionarios 
SET tipo = 'supervisor' 
WHERE id = (SELECT id FROM funcionarios LIMIT 1);

-- Verificar se a atualização foi feita
SELECT id, nome, tipo FROM funcionarios;
