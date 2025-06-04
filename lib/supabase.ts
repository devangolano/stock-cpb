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
  updated_at: string
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

// Tipos para formulários (sem campos automáticos)
export type FuncionarioInput = Omit<Funcionario, "id" | "created_at" | "updated_at">
export type CategoriaInput = Omit<Categoria, "id" | "created_at" | "updated_at">
export type PrateleiraInput = Omit<Prateleira, "id" | "created_at" | "updated_at">
export type ProdutoInput = Omit<Produto, "id" | "created_at" | "updated_at" | "categorias">
export type MovimentacaoInput = Omit<Movimentacao, "id" | "created_at" | "produtos" | "funcionarios">

// Funções auxiliares
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false
  const savedUser = localStorage.getItem("cpb-user")
  return !!savedUser
}

export function getCurrentUser(): Funcionario | null {
  if (typeof window === "undefined") return null
  const savedUser = localStorage.getItem("cpb-user")
  if (!savedUser) return null
  try {
    return JSON.parse(savedUser)
  } catch {
    return null
  }
}

export function isSupervisor(): boolean {
  const user = getCurrentUser()
  return user?.tipo === "supervisor"
}
