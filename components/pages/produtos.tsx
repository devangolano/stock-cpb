"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, Search, Plus, Eye, Edit, ArrowLeft, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface PrateleiraProdutos {
  numero: string
  descricao: string
  totalProdutos: number
  produtosAbaixoMinimo: number
  valorTotalEstoque: number
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

  useEffect(() => {
    loadPrateleirasComProdutos()
  }, [])

  const loadPrateleirasComProdutos = async () => {
    try {
      // Buscar todos os produtos ativos
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("prateleira, preco_venda, estoque_loja, estoque_armazem, estoque_minimo")
        .eq("ativo", true)
        .not("prateleira", "is", null)
        .not("prateleira", "eq", "")

      if (produtosError) throw produtosError

      // Agrupar por prateleira
      const prateleirasMap = new Map<string, PrateleiraProdutos>()

      produtosData?.forEach((produto) => {
        const prateleira = produto.prateleira
        if (!prateleira) return

        if (!prateleirasMap.has(prateleira)) {
          prateleirasMap.set(prateleira, {
            numero: prateleira,
            descricao: `Prateleira ${prateleira}`,
            totalProdutos: 0,
            produtosAbaixoMinimo: 0,
            valorTotalEstoque: 0,
          })
        }

        const prateleiraData = prateleirasMap.get(prateleira)!
        prateleiraData.totalProdutos++

        const estoqueTotal = produto.estoque_loja + produto.estoque_armazem
        if (estoqueTotal < produto.estoque_minimo) {
          prateleiraData.produtosAbaixoMinimo++
        }

        prateleiraData.valorTotalEstoque += estoqueTotal * produto.preco_venda
      })

      // Buscar descrições das prateleiras cadastradas
      try {
        const { data: prateleirasData } = await supabase
          .from("prateleiras")
          .select("numero, descricao")
          .eq("ativo", true)

        prateleirasData?.forEach((prateleira) => {
          if (prateleirasMap.has(prateleira.numero)) {
            prateleirasMap.get(prateleira.numero)!.descricao = prateleira.descricao || `Prateleira ${prateleira.numero}`
          }
        })
      } catch (error) {
        console.log("Tabela prateleiras não encontrada, usando dados dos produtos")
      }

      setPrateleiras(Array.from(prateleirasMap.values()).sort((a, b) => a.numero.localeCompare(b.numero)))
    } catch (error) {
      console.error("Erro ao carregar prateleiras com produtos:", error)
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
  }

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatCurrency = (value: number) => {
    return `Kz ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
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
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{prateleiraInfo?.descricao}</h1>
              <p className="text-sm md:text-base text-gray-600">{filteredProdutos.length} produtos</p>
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

        {/* Grid de Produtos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProdutos.length > 0 ? (
            filteredProdutos.map((produto) => (
              <Card key={produto.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{produto.nome}</h3>
                      <p className="text-xs text-gray-600">Cód: {produto.codigo}</p>
                      <p className="text-xs text-gray-600">Cat: {produto.categoria}</p>
                    </div>
                    {produto.estoque_loja + produto.estoque_armazem < produto.estoque_minimo && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Baixo
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço:</span>
                      <span className="font-medium">{formatCurrency(produto.preco_venda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loja:</span>
                      <span className="font-medium text-blue-600">{produto.estoque_loja} un</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Armazém:</span>
                      <span className="font-medium text-green-600">{produto.estoque_armazem} un</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onNavigateToView?.(produto.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onNavigateToEdit?.(produto.id)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm
                      ? "Tente ajustar os termos da pesquisa."
                      : "Esta prateleira não possui produtos cadastrados."}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm md:text-base text-gray-600">Gestão de produtos por prateleira</p>
        </div>
        <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Grid de Prateleiras com Produtos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {prateleiras.map((prateleira) => (
          <Button
            key={prateleira.numero}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => loadProdutosPrateleira(prateleira.numero)}
          >
            <div className="text-lg font-bold text-gray-900">{prateleira.numero}</div>
            <div className="text-xs text-gray-600 text-center line-clamp-2">{prateleira.descricao}</div>
            <div className="flex flex-col items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {prateleira.totalProdutos} itens
              </Badge>
              {prateleira.produtosAbaixoMinimo > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {prateleira.produtosAbaixoMinimo} baixo
                </Badge>
              )}
              <div className="text-xs text-gray-600">{formatCurrency(prateleira.valorTotalEstoque)}</div>
            </div>
          </Button>
        ))}
      </div>

      {prateleiras.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">Cadastre produtos para começar a usar o sistema.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
