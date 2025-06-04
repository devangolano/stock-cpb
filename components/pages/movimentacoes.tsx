"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, ArrowLeft, Plus, Eye, Search, Calendar, ArrowUp, ArrowDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface PrateleiraMovimentacao {
  numero: string
  descricao: string
  totalMovimentacoes: number
  produtosAfetados: number
  ultimaMovimentacao: string
}

interface MovimentacaoDetalhada {
  id: string
  tipo: string
  local: string
  quantidade: number
  motivo: string
  observacoes: string
  created_at: string
  funcionario_nome: string
  produto: {
    id: string
    codigo: string
    nome: string
  }
}

interface MovimentacoesProps {
  onNavigateToCreate?: () => void
  onNavigateToView?: (movimentacaoId: string) => void
}

export function Movimentacoes({ onNavigateToCreate, onNavigateToView }: MovimentacoesProps) {
  const { toast } = useToast()
  const [prateleiras, setPrateleiras] = useState<PrateleiraMovimentacao[]>([])
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoDetalhada[]>([])
  const [prateleiraAtual, setPrateleiraAtual] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (prateleiraAtual) {
      loadMovimentacoesPrateleira(prateleiraAtual)
    } else {
      loadPrateleirasComMovimentacoes()
    }
  }, [prateleiraAtual])

  const loadPrateleirasComMovimentacoes = async () => {
    try {
      // Buscar todas as movimentações com produtos
      const { data: movimentacoesData, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          tipo,
          quantidade,
          created_at,
          produto_id,
          produtos!inner (
            id,
            codigo,
            nome,
            prateleira
          )
        `)
        .order("created_at", { ascending: false })

      if (movError) throw movError

      // Agrupar por prateleira
      const prateleirasMap = new Map<string, PrateleiraMovimentacao>()

      movimentacoesData?.forEach((mov) => {
        const prateleira = mov.produtos.prateleira
        if (!prateleira) return

        if (!prateleirasMap.has(prateleira)) {
          prateleirasMap.set(prateleira, {
            numero: prateleira,
            descricao: `Prateleira ${prateleira}`,
            totalMovimentacoes: 0,
            produtosAfetados: 0,
            ultimaMovimentacao: mov.created_at,
          })
        }

        const prateleiraData = prateleirasMap.get(prateleira)!
        prateleiraData.totalMovimentacoes++

        // Atualizar última movimentação se for mais recente
        if (new Date(mov.created_at) > new Date(prateleiraData.ultimaMovimentacao)) {
          prateleiraData.ultimaMovimentacao = mov.created_at
        }
      })

      // Contar produtos únicos por prateleira
      for (const [prateleira, data] of prateleirasMap.entries()) {
        const produtosUnicos = new Set(
          movimentacoesData?.filter((mov) => mov.produtos.prateleira === prateleira).map((mov) => mov.produto_id),
        )
        data.produtosAfetados = produtosUnicos.size
      }

      setPrateleiras(Array.from(prateleirasMap.values()).sort((a, b) => a.numero.localeCompare(b.numero)))
    } catch (error) {
      console.error("Erro ao carregar prateleiras com movimentações:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMovimentacoesPrateleira = async (numeroprateleira: string) => {
    try {
      // Primeiro buscar os produtos da prateleira
      const { data: produtos, error: produtosError } = await supabase
        .from("produtos")
        .select("id")
        .eq("prateleira", numeroprateleira)
        .eq("ativo", true)

      if (produtosError) throw produtosError

      const produtoIds = produtos?.map((p) => p.id) || []

      if (produtoIds.length === 0) {
        setMovimentacoes([])
        return
      }

      // Buscar movimentações desses produtos
      const { data: movimentacoesData, error: movError } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          tipo,
          local,
          quantidade,
          motivo,
          observacoes,
          created_at,
          funcionarios (nome),
          produtos (id, codigo, nome)
        `)
        .in("produto_id", produtoIds)
        .order("created_at", { ascending: false })

      if (movError) throw movError

      const movimentacoesFormatadas =
        movimentacoesData?.map((mov) => ({
          id: mov.id,
          tipo: mov.tipo,
          local: mov.local,
          quantidade: mov.quantidade,
          motivo: mov.motivo || "",
          observacoes: mov.observacoes || "",
          created_at: mov.created_at,
          funcionario_nome: mov.funcionarios?.nome || "N/A",
          produto: {
            id: mov.produtos.id,
            codigo: mov.produtos.codigo,
            nome: mov.produtos.nome,
          },
        })) || []

      setMovimentacoes(movimentacoesFormatadas)
    } catch (error) {
      console.error("Erro ao carregar movimentações da prateleira:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as movimentações da prateleira.",
        variant: "destructive",
      })
    }
  }

  const voltarParaPrateleiras = () => {
    setPrateleiraAtual(null)
    setMovimentacoes([])
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredMovimentacoes = movimentacoes.filter((mov) => {
    const produtoNome = mov.produto.nome.toLowerCase()
    const produtoCodigo = mov.produto.codigo.toLowerCase()
    const funcionarioNome = mov.funcionario_nome.toLowerCase()
    const searchLower = searchTerm.toLowerCase()

    return (
      produtoNome.includes(searchLower) || produtoCodigo.includes(searchLower) || funcionarioNome.includes(searchLower)
    )
  })

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
                Movimentações - Prateleira {prateleiraAtual}
              </h1>
              <p className="text-sm md:text-base text-gray-600">{movimentacoes.length} movimentações encontradas</p>
            </div>
            <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card className="mb-4">
          <CardContent className="p-3 md:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar movimentações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="block md:hidden space-y-3">
          {filteredMovimentacoes.length > 0 ? (
            filteredMovimentacoes.map((mov) => (
              <Card key={mov.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{mov.produto.nome}</h3>
                      <p className="text-xs text-gray-600">Cód: {mov.produto.codigo}</p>
                    </div>
                    <Badge variant={mov.tipo === "entrada" ? "default" : "destructive"} className="text-xs">
                      {mov.tipo === "entrada" ? (
                        <>
                          <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                        </>
                      ) : (
                        <>
                          <ArrowDown className="h-3 w-3 mr-1" /> Saída
                        </>
                      )}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                    <div>
                      <p className="text-gray-600">Data</p>
                      <p className="font-medium">{formatDate(mov.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Local</p>
                      <p className="font-medium">{mov.local === "loja" ? "Loja" : "Armazém"}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Qtd</p>
                      <p className="font-medium">{mov.quantidade}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resp.</p>
                      <p className="font-medium">{mov.funcionario_nome}</p>
                    </div>
                  </div>

                  {mov.motivo && (
                    <div className="text-xs mb-3">
                      <p className="text-gray-600">Motivo</p>
                      <p className="font-medium">{mov.motivo}</p>
                    </div>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => onNavigateToView?.(mov.id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Ver
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma movimentação encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">Esta prateleira não possui movimentações registradas.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Tipo</TableHead>
                <TableHead className="text-center">Local</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Resp.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovimentacoes.length > 0 ? (
                filteredMovimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(mov.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{mov.produto.nome}</div>
                        <div className="text-xs text-gray-500">Cód: {mov.produto.codigo}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={mov.tipo === "entrada" ? "default" : "destructive"} className="whitespace-nowrap">
                        {mov.tipo === "entrada" ? (
                          <>
                            <ArrowUp className="h-3 w-3 mr-1" /> Entrada
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-3 w-3 mr-1" /> Saída
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{mov.local === "loja" ? "Loja" : "Armazém"}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-medium">{mov.quantidade}</TableCell>
                    <TableCell>{mov.motivo || "-"}</TableCell>
                    <TableCell>{mov.funcionario_nome}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="secondary" size="sm" onClick={() => onNavigateToView?.(mov.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma movimentação encontrada</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Nenhuma movimentação foi registrada para esta prateleira.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Movimentações</h1>
          <p className="text-sm md:text-base text-gray-600">Histórico de movimentações por prateleira</p>
        </div>
        <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Movimentação
        </Button>
      </div>

      {/* Grid de Prateleiras com Movimentações */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {prateleiras.map((prateleira) => (
          <Button
            key={prateleira.numero}
            variant="outline"
            className="h-auto p-4 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300"
            onClick={() => setPrateleiraAtual(prateleira.numero)}
          >
            <div className="text-lg font-bold text-gray-900">{prateleira.numero}</div>
            <div className="text-xs text-gray-600 text-center">{prateleira.descricao}</div>
            <div className="flex flex-col items-center gap-1">
              <Badge variant="secondary" className="text-xs">
                {prateleira.totalMovimentacoes} mov.
              </Badge>
              <Badge variant="outline" className="text-xs">
                {prateleira.produtosAfetados} produtos
              </Badge>
              <div className="text-xs text-gray-500">{formatDate(prateleira.ultimaMovimentacao)}</div>
            </div>
          </Button>
        ))}
      </div>

      {prateleiras.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma movimentação encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">Ainda não há movimentações registradas no sistema.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
