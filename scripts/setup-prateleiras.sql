-- Verificar se a tabela prateleiras existe, se não, criar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'prateleiras') THEN
        CREATE TABLE prateleiras (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            numero VARCHAR(50) NOT NULL UNIQUE,
            descricao TEXT,
            ativo BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Inserir algumas prateleiras de exemplo
        INSERT INTO prateleiras (numero, descricao) VALUES 
        ('Prat 01', 'Produtos de escritório e papelaria'),
        ('Prat 02', 'Equipamentos eletrônicos'),
        ('Prat 03', 'Material de limpeza'),
        ('Prat 04', 'Produtos alimentícios');
        
        RAISE NOTICE 'Tabela prateleiras criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela prateleiras já existe.';
    END IF;
END $$;

-- Verificar se a coluna tipo existe na tabela funcionarios, se não, adicionar
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'funcionarios' AND column_name = 'tipo') THEN
        ALTER TABLE funcionarios ADD COLUMN tipo VARCHAR(20) DEFAULT 'funcionario';
        
        -- Atualizar o usuário existente para supervisor
        UPDATE funcionarios 
        SET tipo = 'supervisor' 
        WHERE telefone = '948324028';
        
        RAISE NOTICE 'Coluna tipo adicionada à tabela funcionarios!';
    ELSE
        RAISE NOTICE 'Coluna tipo já existe na tabela funcionarios.';
    END IF;
END $$;
