"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface PrateleiraDashboard {
  id: string
  numero: string
  descricao: string
  totalProdutos: number
  produtosAbaixoMinimo: number
}

interface ProdutoPrateleira {
  id: string
  codigo: string
  nome: string
  estoque_loja: number
  estoque_armazem: number
  estoque_minimo: number
}

interface DashboardProps {
  onNavigateToProduct?: (productId: string) => void
}

export function Dashboard({ onNavigateToProduct }: DashboardProps) {
  const { toast } = useToast()
  const [prateleiras, setPrateleiras] = useState<PrateleiraDashboard[]>([])
  const [produtosPrateleira, setProdutosPrateleira] = useState<ProdutoPrateleira[]>([])
  const [prateleiraAtual, setPrateleiraAtual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPrateleiras()
  }, [])

  const loadPrateleiras = async () => {
    try {
      setError(null)

      // Primeiro, buscar todos os produtos ativos com suas prateleiras
      const { data: produtosData, error: produtosError } = await supabase
        .from("produtos")
        .select("prateleira, estoque_loja, estoque_armazem, estoque_minimo")
        .eq("ativo", true)
        .not("prateleira", "is", null)
        .not("prateleira", "eq", "")

      if (produtosError) throw produtosError

      // Agrupar produtos por prateleira
      const prateleirasMap = new Map<string, PrateleiraDashboard>()

      produtosData?.forEach((produto) => {
        const prateleira = produto.prateleira
        if (!prateleira) return

        if (!prateleirasMap.has(prateleira)) {
          prateleirasMap.set(prateleira, {
            id: prateleira,
            numero: prateleira,
            descricao: `Prateleira ${prateleira}`,
            totalProdutos: 0,
            produtosAbaixoMinimo: 0,
          })
        }

        const prateleiraData = prateleirasMap.get(prateleira)!
        prateleiraData.totalProdutos++

        if (produto.estoque_loja + produto.estoque_armazem < produto.estoque_minimo) {
          prateleiraData.produtosAbaixoMinimo++
        }
      })

      // Buscar descrições das prateleiras cadastradas na tabela prateleiras
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
      console.error("Erro ao carregar prateleiras:", error)
      setError("Erro ao carregar dados das prateleiras. Tente novamente.")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as prateleiras.",
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
        .select("id, codigo, nome, estoque_loja, estoque_armazem, estoque_minimo")
        .eq("ativo", true)
        .eq("prateleira", numeroprateleira)
        .order("nome")

      if (error) throw error

      setProdutosPrateleira(data || [])
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
    setProdutosPrateleira([])
  }

  const handleProductClick = (productId: string) => {
    if (onNavigateToProduct) {
      onNavigateToProduct(productId)
    }
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

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Erro de Configuração</h3>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <Button onClick={loadPrateleiras} variant="outline" className="border-red-300 text-red-700">
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
            ← Voltar às Prateleiras
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{prateleiraInfo?.descricao}</h1>
          <p className="text-sm md:text-base text-gray-600">{produtosPrateleira.length} produtos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {produtosPrateleira.length > 0 ? (
            produtosPrateleira.map((produto) => (
              <Card
                key={produto.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleProductClick(produto.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{produto.nome}</h3>
                      <p className="text-xs text-gray-600">Cód: {produto.codigo}</p>
                    </div>
                    {produto.estoque_loja + produto.estoque_armazem < produto.estoque_minimo && (
                      <Badge variant="destructive" className="text-xs ml-2">
                        Baixo
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Loja:</span>
                      <span className="font-medium text-blue-600">{produto.estoque_loja} un</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Armazém:</span>
                      <span className="font-medium text-green-600">{produto.estoque_armazem} un</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card>
                <CardContent className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum produto encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">Esta prateleira não possui produtos cadastrados.</p>
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
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600">Controle de estoque por prateleiras</p>
      </div>

      {/* Grid de Prateleiras como Botões */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {prateleiras.map((prateleira) => (
          <Button
            key={prateleira.id}
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
                  {prateleira.produtosAbaixoMinimo} baixo
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>

      {prateleiras.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma prateleira encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cadastre produtos com prateleiras para começar a usar o sistema.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
