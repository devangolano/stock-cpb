"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Search, Plus, Eye, Edit, ArrowLeft, AlertTriangle, ShellIcon as Shelf, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface PrateleiraProdutos {
  id: string
  numero: string
  descricao: string
  totalProdutos: number
  produtosAbaixoMinimo: number
  valorTotalEstoque: number
  ativo: boolean
}

interface Produto {
  id: string
  codigo: string
  nome: string
  categoria: string
  preco_venda: number
  estoque_loja: number
  estoque_armazem: number
  estoque_minimo: number
  prateleira: string
}

interface ProdutosProps {
  onNavigateToCreate?: () => void
  onNavigateToEdit?: (productId: string) => void
  onNavigateToView?: (productId: string) => void
}

export function Produtos({ onNavigateToCreate, onNavigateToEdit, onNavigateToView }: ProdutosProps) {
  const { toast } = useToast()
  const [prateleiras, setPrateleiras] = useState<PrateleiraProdutos[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [prateleiraAtual, setPrateleiraAtual] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados para edição inline de estoque
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [tempStockValue, setTempStockValue] = useState<number>(0)

  useEffect(() => {
    loadPrateleirasComProdutos()
  }, [])

  const loadPrateleirasComProdutos = async () => {
    try {
      setError(null)

      // Primeiro, buscar TODAS as prateleiras cadastradas
      const { data: prateleirasData, error: prateleirasError } = await supabase
        .from("prateleiras")
        .select("id, numero, descricao, ativo")
        .eq("ativo", true)
        .order("numero")

      if (prateleirasError) throw prateleirasError

      if (!prateleirasData || prateleirasData.length === 0) {
        setPrateleiras([])
        setLoading(false)
        return
      }

      // Buscar todos os produtos ativos para contar por prateleira
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("prateleira, preco_venda, estoque_loja, estoque_armazem, estoque_minimo")
        .eq("ativo", true)

      if (produtosError) throw produtosError

      // Criar mapa de contagem de produtos por prateleira
      const produtosPorPrateleira = new Map<
        string,
        { total: number; abaixoMinimo: number; valorTotalEstoque: number }
      >()

      produtosData?.forEach((produto) => {
        if (!produto.prateleira) return

        if (!produtosPorPrateleira.has(produto.prateleira)) {
          produtosPorPrateleira.set(produto.prateleira, { total: 0, abaixoMinimo: 0, valorTotalEstoque: 0 })
        }

        const contagem = produtosPorPrateleira.get(produto.prateleira)!
        contagem.total++

        const estoqueTotal = produto.estoque_loja + produto.estoque_armazem
        if (estoqueTotal < produto.estoque_minimo) {
          contagem.abaixoMinimo++
        }

        contagem.valorTotalEstoque += estoqueTotal * produto.preco_venda
      })

      // Combinar dados das prateleiras com contagem de produtos
      const prateleirasCompletas: PrateleiraProdutos[] = prateleirasData.map((prateleira) => {
        const contagem = produtosPorPrateleira.get(prateleira.numero) || {
          total: 0,
          abaixoMinimo: 0,
          valorTotalEstoque: 0,
        }

        return {
          id: prateleira.id,
          numero: prateleira.numero,
          descricao: prateleira.descricao || `Prateleira ${prateleira.numero}`,
          totalProdutos: contagem.total,
          produtosAbaixoMinimo: contagem.abaixoMinimo,
          valorTotalEstoque: contagem.valorTotalEstoque,
          ativo: prateleira.ativo,
        }
      })

      setPrateleiras(prateleirasCompletas)
    } catch (error) {
      console.error("Erro ao carregar prateleiras com produtos:", error)
      setError("Erro ao carregar dados das prateleiras. Tente novamente.")
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadProdutosPrateleira = async (numeroprateleira: string) => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("ativo", true)
        .eq("prateleira", numeroprateleira)
        .order("nome")

      if (error) throw error

      setProdutos(data || [])
      setPrateleiraAtual(numeroprateleira)
    } catch (error) {
      console.error("Erro ao carregar produtos da prateleira:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos da prateleira.",
        variant: "destructive",
      })
    }
  }

  const voltarParaPrateleiras = () => {
    setPrateleiraAtual(null)
    setProdutos([])
    setSearchTerm("")
    setCurrentPage(1)
  }

  // Função para salvar estoque editado
  const handleSaveStock = async (productId: string, newStock: number) => {
    try {
      const { error } = await supabase.from("produtos").update({ estoque_loja: newStock }).eq("id", productId)

      if (error) throw error

      toast({
        title: "Estoque atualizado",
        description: "A quantidade da loja foi atualizada com sucesso.",
      })

      // Recarregar produtos da prateleira
      if (prateleiraAtual) {
        loadProdutosPrateleira(prateleiraAtual)
      }

      setEditingStock(null)
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estoque.",
        variant: "destructive",
      })
    }
  }

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setEditingStock(null)
    setTempStockValue(0)
  }

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (value: number) => {
    return `Kz ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const totalPages = Math.ceil(filteredProdutos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProdutos = filteredProdutos.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir o produto "${productName}"?`)) {
      return
    }

    try {
      const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", productId)

      if (error) throw error

      toast({
        title: "Produto excluído",
        description: `O produto "${productName}" foi excluído com sucesso.`,
      })

      // Recarregar produtos da prateleira
      if (prateleiraAtual) {
        loadProdutosPrateleira(prateleiraAtual)
      }
    } catch (error) {
      console.error("Erro ao excluir produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro de Configuração</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <Button onClick={loadPrateleirasComProdutos} variant="outline" className="border-red-300 text-red-700">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (prateleiraAtual) {
    const prateleiraInfo = prateleiras.find((p) => p.numero === prateleiraAtual)

    return (
      <div className="p-3 md:p-6">
        <div className="mb-6">
          <Button variant="outline" onClick={voltarParaPrateleiras} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar às Prateleiras
          </Button>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                {prateleiraInfo?.numero} - <span className="font-bold">{prateleiraInfo?.descricao}</span>
              </h1>
              <p className="text-sm md:text-base text-gray-600">
                {filteredProdutos.length} {filteredProdutos.length === 1 ? "produto" : "produtos"}
              </p>
            </div>
            <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </div>
        </div>

        {/* Barra de Pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Pesquisar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabela Responsiva de Produtos */}
        <Card className="shadow-sm">
          <CardContent className="p-0">
            {filteredProdutos.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Produto</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-700 hidden sm:table-cell">Loja</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-700 hidden sm:table-cell">
                          Armazém
                        </th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-700">Total</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">Preço</th>
                        <th className="text-center py-3 px-3 font-semibold text-gray-700">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProdutos.map((produto, index) => (
                        <tr
                          key={produto.id}
                          className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="py-2 px-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm">
                                  <span className="sm:hidden">
                                    {produto.nome.length > 15 ? `${produto.nome.substring(0, 15)}...` : produto.nome}
                                  </span>
                                  <span className="hidden sm:inline">{produto.nome}</span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                  <span className="font-mono bg-gray-100 px-1 rounded">{produto.codigo}</span>
                                  {/* Mostrar estoque mobile apenas em telas pequenas */}
                                  <span className="sm:hidden text-blue-600 font-medium">
                                    L:{produto.estoque_loja} A:{produto.estoque_armazem}
                                  </span>
                                </div>
                              </div>
                              {produto.estoque_loja + produto.estoque_armazem < produto.estoque_minimo && (
                                <Badge variant="destructive" className="text-xs px-1 py-0 h-5">
                                  Baixo
                                </Badge>
                              )}
                            </div>
                          </td>

                          {/* Coluna Loja com edição inline */}
                          <td
                            className="py-2 px-3 text-center hidden sm:table-cell"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {editingStock === produto.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={tempStockValue}
                                  onChange={(e) => setTempStockValue(Number(e.target.value))}
                                  className="w-16 h-6 text-xs text-center p-1"
                                  min="0"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleSaveStock(produto.id, tempStockValue)
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit()
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveStock(produto.id, tempStockValue)}
                                  className="h-6 w-6 p-0"
                                >
                                  ✓
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelEdit} className="h-6 w-6 p-0">
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <span
                                className="inline-flex items-center justify-center w-8 h-6 bg-blue-100 text-blue-700 rounded text-xs font-medium cursor-pointer hover:bg-blue-200"
                                onClick={() => {
                                  setEditingStock(produto.id)
                                  setTempStockValue(produto.estoque_loja)
                                }}
                              >
                                {produto.estoque_loja}
                              </span>
                            )}
                          </td>

                          <td className="py-2 px-3 text-center hidden sm:table-cell">
                            <span className="inline-flex items-center justify-center w-8 h-6 bg-green-100 text-green-700 rounded text-xs font-medium">
                              {produto.estoque_armazem}
                            </span>
                          </td>

                          <td className="py-2 px-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-6 bg-gray-100 text-gray-800 rounded text-xs font-bold">
                              {produto.estoque_loja + produto.estoque_armazem}
                            </span>
                          </td>

                          {/* Preço oculto no mobile */}
                          <td className="py-2 px-4 text-right hidden md:table-cell">
                            <span className="text-sm font-medium text-gray-900">
                              {formatCurrency(produto.preco_venda)}
                            </span>
                          </td>

                          <td className="py-2 px-3">
                            <div className="flex justify-center gap-1">
                              {/* Mobile: apenas editar e excluir */}
                              <div className="sm:hidden flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateToEdit?.(produto.id)}
                                  className="h-7 w-7 p-0 hover:bg-green-100"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(produto.id, produto.nome)}
                                  className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Desktop: todos os botões */}
                              <div className="hidden sm:flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateToView?.(produto.id)}
                                  className="h-7 w-7 p-0 hover:bg-blue-100"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateToEdit?.(produto.id)}
                                  className="h-7 w-7 p-0 hover:bg-green-100"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteProduct(produto.id, produto.nome)}
                                  className="h-7 w-7 p-0 hover:bg-red-100 text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paginação Responsiva */}
                {totalPages > 1 && (
                  <div className="flex flex-col items-center justify-center px-4 py-3 bg-gray-50 border-t border-gray-200 gap-3">
                    {/* Informação de páginas - sempre visível */}
                    <div className="text-sm text-gray-700 text-center">
                      <span className="hidden sm:inline">
                        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredProdutos.length)} de{" "}
                        {filteredProdutos.length} produtos
                      </span>
                      <span className="sm:hidden">
                        {startIndex + 1}-{Math.min(endIndex, filteredProdutos.length)} de {filteredProdutos.length}
                      </span>
                    </div>

                    {/* Controles de paginação - sempre visível */}
                    <div className="flex items-center justify-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-3"
                      >
                        <span className="hidden sm:inline">Anterior</span>
                        <span className="sm:hidden">‹</span>
                      </Button>

                      {/* Indicador de página atual - sempre visível */}
                      <div className="flex items-center gap-1">
                        {/* Mobile: mostrar apenas página atual */}
                        <div className="sm:hidden">
                          <span className="px-3 py-1 text-sm font-medium bg-white border rounded">
                            {currentPage} / {totalPages}
                          </span>
                        </div>

                        {/* Desktop: mostrar números das páginas */}
                        <div className="hidden sm:flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              )
                            })
                            .map((page, index, array) => {
                              const prevPage = array[index - 1]
                              const showEllipsis = prevPage && page - prevPage > 1

                              return (
                                <div key={page} className="flex items-center">
                                  {showEllipsis && <span className="px-2 text-gray-400">...</span>}
                                  <Button
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className="h-8 w-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                </div>
                              )
                            })}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3"
                      >
                        <span className="hidden sm:inline">Próxima</span>
                        <span className="sm:hidden">›</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Nenhum produto encontrado" : "Prateleira Vazia"}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchTerm
                    ? "Tente ajustar os termos da pesquisa."
                    : "Esta prateleira não possui produtos cadastrados ainda."}
                </p>
                <Button variant="outline" onClick={onNavigateToCreate} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm md:text-base text-gray-600">
            Gestão de produtos por prateleira • {prateleiras.length} prateleiras cadastradas
          </p>
        </div>
        <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{prateleiras.length}</div>
            <div className="text-xs text-gray-600">Prateleiras</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {prateleiras.reduce((acc, p) => acc + p.totalProdutos, 0)}
            </div>
            <div className="text-xs text-gray-600">Produtos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {prateleiras.filter((p) => p.totalProdutos === 0).length}
            </div>
            <div className="text-xs text-gray-600">Vazias</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {prateleiras.reduce((acc, p) => acc + p.produtosAbaixoMinimo, 0)}
            </div>
            <div className="text-xs text-gray-600">Estoque Baixo</div>
          </CardContent>
        </Card>
      </div>

      {/* Grid de Prateleiras com Produtos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {prateleiras.map((prateleira) => (
          <Button
            key={prateleira.id}
            variant="outline"
            className={`h-auto p-4 flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
              prateleira.totalProdutos === 0
                ? "hover:bg-amber-50 hover:border-amber-300 border-dashed"
                : "hover:bg-blue-50 hover:border-blue-300"
            }`}
            onClick={() => loadProdutosPrateleira(prateleira.numero)}
          >
            <div className="flex items-center gap-2">
              <Shelf className="h-4 w-4 text-gray-500" />
              <div className="text-lg font-bold text-gray-900">{prateleira.numero}</div>
            </div>

            <div className="text-xs text-gray-700 text-center line-clamp-2 font-bold min-h-[2rem] flex items-center">
              {prateleira.descricao}
            </div>

            <div className="flex flex-col items-center gap-1 w-full">
              <Badge
                variant={prateleira.totalProdutos === 0 ? "outline" : "secondary"}
                className="text-xs w-full justify-center"
              >
                {prateleira.totalProdutos === 0 ? "Vazia" : `${prateleira.totalProdutos} itens`}
              </Badge>

              {prateleira.produtosAbaixoMinimo > 0 && (
                <Badge variant="destructive" className="text-xs w-full justify-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {prateleira.produtosAbaixoMinimo} baixo
                </Badge>
              )}

              {prateleira.valorTotalEstoque > 0 && (
                <div className="text-xs text-gray-600 font-medium">{formatCurrency(prateleira.valorTotalEstoque)}</div>
              )}
            </div>
          </Button>
        ))}
      </div>

      {prateleiras.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-12">
            <Shelf className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma prateleira cadastrada</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cadastre prateleiras para organizar seus produtos e facilitar o controle de estoque.
            </p>
            <Button variant="outline" className="text-blue-600 border-blue-300">
              Cadastrar Primeira Prateleira
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
