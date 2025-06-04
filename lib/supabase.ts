import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para o banco de dados
export interface Funcionario {
  id: string
  nome: string
  telefone: string
  senha: string
  tipo: "supervisor" | "funcionario"
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Categoria {
  id: string
  nome: string
  descricao?: string
  ativo: boolean
  created_at: string
}

export interface Prateleira {
  id: string
  numero: string
  descricao?: string
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  codigo: string
  nome: string
  categoria_id: string
  marca?: string
  fornecedor?: string
  preco_custo?: number
  preco_venda: number
  estoque_loja: number
  estoque_armazem: number
  estoque_minimo: number
  prateleira?: string
  codigo_barras?: string
  ativo: boolean
  created_at: string
  updated_at: string
  categorias?: Categoria
}

export interface Movimentacao {
  id: string
  produto_id: string
  funcionario_id: string
  tipo: "entrada" | "saida"
  local: "loja" | "armazem"
  quantidade: number
  motivo?: string
  observacoes?: string
  created_at: string
  produtos?: Produto
  funcionarios?: Funcionario
}
