-- Corrigir permissões de exclusão definitivamente
-- Desabilitar RLS para todas as tabelas

ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE prateleiras DISABLE ROW LEVEL SECURITY;
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Remover políticas da tabela funcionarios
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'funcionarios') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON funcionarios';
    END LOOP;
    
    -- Remover políticas da tabela prateleiras
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'prateleiras') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON prateleiras';
    END LOOP;
    
    -- Remover políticas da tabela produtos
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'produtos') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON produtos';
    END LOOP;
    
    -- Remover políticas da tabela categorias
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categorias') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON categorias';
    END LOOP;
    
    -- Remover políticas da tabela movimentacoes
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'movimentacoes') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON movimentacoes';
    END LOOP;
END $$;

-- Garantir permissões completas para operações CRUD
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

RAISE NOTICE 'Permissões de DELETE corrigidas definitivamente!';
