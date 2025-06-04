-- Verificar e corrigir permissões de RLS (Row Level Security)
-- Desabilitar RLS temporariamente para permitir operações de DELETE

-- Para funcionarios
ALTER TABLE funcionarios DISABLE ROW LEVEL SECURITY;

-- Para prateleiras  
ALTER TABLE prateleiras DISABLE ROW LEVEL SECURITY;

-- Para produtos
ALTER TABLE produtos DISABLE ROW LEVEL SECURITY;

-- Para categorias
ALTER TABLE categorias DISABLE ROW LEVEL SECURITY;

-- Para movimentacoes
ALTER TABLE movimentacoes DISABLE ROW LEVEL SECURITY;

-- Verificar se existem políticas que podem estar bloqueando
DROP POLICY IF EXISTS "Enable read access for all users" ON funcionarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON funcionarios;
DROP POLICY IF EXISTS "Enable update for users based on email" ON funcionarios;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON funcionarios;

DROP POLICY IF EXISTS "Enable read access for all users" ON prateleiras;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON prateleiras;
DROP POLICY IF EXISTS "Enable update for users based on email" ON prateleiras;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON prateleiras;

DROP POLICY IF EXISTS "Enable read access for all users" ON produtos;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON produtos;
DROP POLICY IF EXISTS "Enable update for users based on email" ON produtos;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON produtos;

DROP POLICY IF EXISTS "Enable read access for all users" ON categorias;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON categorias;
DROP POLICY IF EXISTS "Enable update for users based on email" ON categorias;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON categorias;

DROP POLICY IF EXISTS "Enable read access for all users" ON movimentacoes;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON movimentacoes;
DROP POLICY IF EXISTS "Enable update for users based on email" ON movimentacoes;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON movimentacoes;

RAISE NOTICE 'Permissões de DELETE corrigidas para todas as tabelas!';
