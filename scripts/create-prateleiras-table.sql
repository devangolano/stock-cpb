-- Criar tabela de prateleiras
CREATE TABLE IF NOT EXISTS prateleiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero VARCHAR(50) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar campo tipo ao funcionarios para diferenciar supervisor de funcionário normal
ALTER TABLE funcionarios ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'funcionario';

-- Atualizar o usuário existente para supervisor
UPDATE funcionarios 
SET tipo = 'supervisor' 
WHERE telefone = '948324028';

-- Inserir algumas prateleiras de exemplo
INSERT INTO prateleiras (numero, descricao) VALUES 
('Prat 01', 'Produtos de escritório e papelaria'),
('Prat 02', 'Equipamentos eletrônicos'),
('Prat 03', 'Material de limpeza'),
('Prat 04', 'Produtos alimentícios')
ON CONFLICT (numero) DO NOTHING;
