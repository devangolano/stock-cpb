import { supabase } from "./supabase"
import type {
  Funcionario,
  Categoria,
  Prateleira,
  Produto,
  Movimentacao,
  FuncionarioInput,
  CategoriaInput,
  PrateleiraInput,
  ProdutoInput,
  MovimentacaoInput,
} from "./supabase"

// =====================================================
// FUNCIONÁRIOS
// =====================================================

export const funcionariosService = {
  // Listar todos os funcionários
  async getAll(): Promise<Funcionario[]> {
    const { data, error } = await supabase.from("funcionarios").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  // Buscar funcionário por ID
  async getById(id: string): Promise<Funcionario | null> {
    const { data, error } = await supabase.from("funcionarios").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Criar novo funcionário
  async create(funcionario: FuncionarioInput): Promise<Funcionario> {
    // Criptografar senha usando a função do banco
    const { data: hashedPassword, error: hashError } = await supabase.rpc("crypt", {
      password: funcionario.senha,
      salt: await supabase.rpc("gen_salt", { type: "bf" }),
    })

    if (hashError) throw hashError

    const { data, error } = await supabase
      .from("funcionarios")
      .insert([{ ...funcionario, senha: hashedPassword }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Atualizar funcionário
  async update(id: string, funcionario: Partial<FuncionarioInput>): Promise<Funcionario> {
    const updateData = { ...funcionario }

    // Se está atualizando a senha, criptografar
    if (funcionario.senha) {
      const { data: hashedPassword, error: hashError } = await supabase.rpc("crypt", {
        password: funcionario.senha,
        salt: await supabase.rpc("gen_salt", { type: "bf" }),
      })

      if (hashError) throw hashError
      updateData.senha = hashedPassword
    }

    const { data, error } = await supabase.from("funcionarios").update(updateData).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  // Deletar funcionário (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("funcionarios").update({ ativo: false }).eq("id", id)

    if (error) throw error
  },

  // Ativar/Desativar funcionário
  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase.from("funcionarios").update({ ativo }).eq("id", id)

    if (error) throw error
  },
}

// =====================================================
// CATEGORIAS
// =====================================================

export const categoriasService = {
  // Listar todas as categorias
  async getAll(): Promise<Categoria[]> {
    const { data, error } = await supabase.from("categorias").select("*").order("nome")

    if (error) throw error
    return data || []
  },

  // Listar apenas categorias ativas
  async getActive(): Promise<Categoria[]> {
    const { data, error } = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")

    if (error) throw error
    return data || []
  },

  // Buscar categoria por ID
  async getById(id: string): Promise<Categoria | null> {
    const { data, error } = await supabase.from("categorias").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Criar nova categoria
  async create(categoria: CategoriaInput): Promise<Categoria> {
    const { data, error } = await supabase.from("categorias").insert([categoria]).select().single()

    if (error) throw error
    return data
  },

  // Atualizar categoria
  async update(id: string, categoria: Partial<CategoriaInput>): Promise<Categoria> {
    const { data, error } = await supabase.from("categorias").update(categoria).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  // Deletar categoria (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("categorias").update({ ativo: false }).eq("id", id)

    if (error) throw error
  },

  // Ativar/Desativar categoria
  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase.from("categorias").update({ ativo }).eq("id", id)

    if (error) throw error
  },
}

// =====================================================
// PRATELEIRAS
// =====================================================

export const prateleirasService = {
  // Listar todas as prateleiras
  async getAll(): Promise<Prateleira[]> {
    const { data, error } = await supabase.from("prateleiras").select("*").order("numero")

    if (error) throw error
    return data || []
  },

  // Listar apenas prateleiras ativas
  async getActive(): Promise<Prateleira[]> {
    const { data, error } = await supabase.from("prateleiras").select("*").eq("ativo", true).order("numero")

    if (error) throw error
    return data || []
  },

  // Buscar prateleira por ID
  async getById(id: string): Promise<Prateleira | null> {
    const { data, error } = await supabase.from("prateleiras").select("*").eq("id", id).single()

    if (error) throw error
    return data
  },

  // Criar nova prateleira
  async create(prateleira: PrateleiraInput): Promise<Prateleira> {
    const { data, error } = await supabase.from("prateleiras").insert([prateleira]).select().single()

    if (error) throw error
    return data
  },

  // Atualizar prateleira
  async update(id: string, prateleira: Partial<PrateleiraInput>): Promise<Prateleira> {
    const { data, error } = await supabase.from("prateleiras").update(prateleira).eq("id", id).select().single()

    if (error) throw error
    return data
  },

  // Deletar prateleira (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("prateleiras").update({ ativo: false }).eq("id", id)

    if (error) throw error
  },

  // Ativar/Desativar prateleira
  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase.from("prateleiras").update({ ativo }).eq("id", id)

    if (error) throw error
  },
}

// =====================================================
// PRODUTOS
// =====================================================

export const produtosService = {
  // Listar todos os produtos com categoria
  async getAll(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .order("nome")

    if (error) throw error
    return data || []
  },

  // Listar apenas produtos ativos
  async getActive(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .eq("ativo", true)
      .order("nome")

    if (error) throw error
    return data || []
  },

  // Buscar produto por ID
  async getById(id: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  // Buscar produto por código
  async getByCodigo(codigo: string): Promise<Produto | null> {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .eq("codigo", codigo)
      .single()

    if (error) throw error
    return data
  },

  // Criar novo produto
  async create(produto: ProdutoInput): Promise<Produto> {
    const { data, error } = await supabase
      .from("produtos")
      .insert([produto])
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Atualizar produto
  async update(id: string, produto: Partial<ProdutoInput>): Promise<Produto> {
    const { data, error } = await supabase
      .from("produtos")
      .update(produto)
      .eq("id", id)
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Deletar produto (soft delete)
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id)

    if (error) throw error
  },

  // Ativar/Desativar produto
  async toggleActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await supabase.from("produtos").update({ ativo }).eq("id", id)

    if (error) throw error
  },

  // Atualizar estoque
  async updateEstoque(id: string, estoque_loja: number, estoque_armazem: number): Promise<void> {
    const { error } = await supabase.from("produtos").update({ estoque_loja, estoque_armazem }).eq("id", id)

    if (error) throw error
  },

  // Produtos com estoque baixo
  async getEstoqueBaixo(): Promise<Produto[]> {
    const { data, error } = await supabase
      .from("produtos")
      .select(`
        *,
        categorias (
          id,
          nome,
          descricao
        )
      `)
      .eq("ativo", true)
      .filter("estoque_loja", "lte", "estoque_minimo")
      .order("nome")

    if (error) throw error
    return data || []
  },
}

// =====================================================
// MOVIMENTAÇÕES
// =====================================================

export const movimentacoesService = {
  // Listar todas as movimentações
  async getAll(): Promise<Movimentacao[]> {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select(`
        *,
        produtos (
          id,
          codigo,
          nome
        ),
        funcionarios (
          id,
          nome
        )
      `)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  // Buscar movimentação por ID
  async getById(id: string): Promise<Movimentacao | null> {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select(`
        *,
        produtos (
          id,
          codigo,
          nome
        ),
        funcionarios (
          id,
          nome
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error
    return data
  },

  // Criar nova movimentação
  async create(movimentacao: MovimentacaoInput): Promise<Movimentacao> {
    const { data, error } = await supabase
      .from("movimentacoes")
      .insert([movimentacao])
      .select(`
        *,
        produtos (
          id,
          codigo,
          nome
        ),
        funcionarios (
          id,
          nome
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Movimentações por produto
  async getByProduto(produto_id: string): Promise<Movimentacao[]> {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select(`
        *,
        produtos (
          id,
          codigo,
          nome
        ),
        funcionarios (
          id,
          nome
        )
      `)
      .eq("produto_id", produto_id)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },

  // Movimentações por período
  async getByPeriodo(dataInicio: string, dataFim: string): Promise<Movimentacao[]> {
    const { data, error } = await supabase
      .from("movimentacoes")
      .select(`
        *,
        produtos (
          id,
          codigo,
          nome
        ),
        funcionarios (
          id,
          nome
        )
      `)
      .gte("created_at", dataInicio)
      .lte("created_at", dataFim)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  },
}
