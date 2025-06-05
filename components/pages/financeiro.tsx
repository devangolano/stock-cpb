"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, DollarSign, Package, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface MovimentacaoFinanceira {
  id: string
  produto_id: string
  quantidade: number
  valor_unitario: number
  valor_total: number
  data: string
  produto_nome: string
  produto_codigo: string
}

interface ResumoFinanceiro {
  totalVendas: number
  totalQuantidade: number
}

interface MovimentacaoData {
  id: string
  produto_id: string
  quantidade: number
  tipo: string
  created_at: string
  produtos: {
    nome: string
    codigo: string
    preco_venda: number
  } | null
  funcionarios: {
    nome: string
  } | null
}

export function Financeiro() {
  const { toast } = useToast()
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoFinanceira[]>([])
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalVendas: 0,
    totalQuantidade: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [periodo, setPeriodo] = useState("hoje")
  const [showFilters, setShowFilters] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    definirPeriodoInicial()
  }, [])

  useEffect(() => {
    if (dataInicio && dataFim) {
      loadMovimentacoesFinanceiras()
    }
  }, [dataInicio, dataFim, currentPage])

  const definirPeriodoInicial = () => {
    const hoje = new Date()
    const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)

    setDataInicio(inicioHoje.toISOString().split("T")[0])
    setDataFim(fimHoje.toISOString().split("T")[0])
  }

  const handlePeriodoChange = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo)
    const hoje = new Date()

    switch (novoPeriodo) {
      case "hoje":
        const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59)
        setDataInicio(inicioHoje.toISOString().split("T")[0])
        setDataFim(fimHoje.toISOString().split("T")[0])
        break

      case "semana":
        const inicioSemana = new Date(hoje)
        inicioSemana.setDate(hoje.getDate() - hoje.getDay())
        inicioSemana.setHours(0, 0, 0, 0)
        const fimSemana = new Date(inicioSemana)
        fimSemana.setDate(inicioSemana.getDate() + 6)
        fimSemana.setHours(23, 59, 59, 999)
        setDataInicio(inicioSemana.toISOString().split("T")[0])
        setDataFim(fimSemana.toISOString().split("T")[0])
        break

      case "mes":
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59)
        setDataInicio(inicioMes.toISOString().split("T")[0])
        setDataFim(fimMes.toISOString().split("T")[0])
        break

      case "ano":
        const inicioAno = new Date(hoje.getFullYear(), 0, 1)
        const fimAno = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59)
        setDataInicio(inicioAno.toISOString().split("T")[0])
        setDataFim(fimAno.toISOString().split("T")[0])
        break
    }

    setCurrentPage(1)
  }

  const loadMovimentacoesFinanceiras = async () => {
    try {
      setLoading(true)

      // Primeiro, contar o total de registros para paginação
      const { count, error: countError } = await supabase
        .from("movimentacoes")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "saida")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`)

      if (countError) throw countError

      const total = count || 0
      setTotalPages(Math.ceil(total / itemsPerPage))

      // Se não há registros, definir dados vazios
      if (total === 0) {
        setMovimentacoes([])
        setResumo({ totalVendas: 0, totalQuantidade: 0 })
        setLoading(false)
        return
      }

      // Calcular o intervalo para paginação
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      // Buscar movimentações de saída (vendas) no período com paginação
      const { data: movimentacoesData, error } = await supabase
        .from("movimentacoes")
        .select(`
          id,
          produto_id,
          quantidade,
          tipo,
          created_at,
          produtos (
            nome,
            codigo,
            preco_venda
          ),
          funcionarios (
            nome
          )
        `)
        .eq("tipo", "saida")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`)
        .order("created_at", { ascending: false })
        .range(from, to)

      if (error) throw error

      // Processar dados financeiros
      const movimentacoesProcessadas: MovimentacaoFinanceira[] = []

      movimentacoesData?.forEach((mov: MovimentacaoData) => {
        const valorUnitario = mov.produtos?.preco_venda || 0
        const valorTotal = valorUnitario * mov.quantidade

        movimentacoesProcessadas.push({
          id: mov.id,
          produto_id: mov.produto_id,
          quantidade: mov.quantidade,
          valor_unitario: valorUnitario,
          valor_total: valorTotal,
          data: mov.created_at,
          produto_nome: mov.produtos?.nome || "Produto não encontrado",
          produto_codigo: mov.produtos?.codigo || "N/A",
        })
      })

      setMovimentacoes(movimentacoesProcessadas)

      // Buscar dados para o resumo (sem paginação)
      const { data: allMovimentacoesData, error: allError } = await supabase
        .from("movimentacoes")
        .select(`
          quantidade,
          produtos (preco_venda)
        `)
        .eq("tipo", "saida")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`)

      if (allError) throw allError

      // Calcular resumo
      let totalVendas = 0
      let totalQuantidade = 0

      allMovimentacoesData?.forEach((mov: any) => {
        const valorUnitario = mov.produtos?.preco_venda || 0
        const valorTotal = valorUnitario * mov.quantidade

        totalVendas += valorTotal
        totalQuantidade += mov.quantidade
      })

      setResumo({
        totalVendas,
        totalQuantidade,
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return `Kz ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
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

  const exportarRelatorio = async () => {
    try {
      setExportingPDF(true)

      // Importar apenas jsPDF
      const jsPDFModule = await import("jspdf")
      const { jsPDF } = jsPDFModule

      // Buscar todos os dados para o relatório
      const { data: allData, error } = await supabase
        .from("movimentacoes")
        .select(`
    id,
    produto_id,
    quantidade,
    tipo,
    created_at,
    produtos (
      nome,
      preco_venda
    ),
    funcionarios (
      nome
    )
  `)
        .eq("tipo", "saida")
        .gte("created_at", `${dataInicio}T00:00:00`)
        .lte("created_at", `${dataFim}T23:59:59`)
        .order("created_at", { ascending: false })

      if (error) throw error

      if (!allData || allData.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "Não há vendas no período selecionado para gerar o relatório.",
          variant: "destructive",
        })
        return
      }

      // Criar novo documento PDF
      const doc = new jsPDF()

      // Configurar fonte e tamanho
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)

      // Título com margem reduzida
      doc.text("RELATÓRIO FINANCEIRO - CPB STOCK", 10, 15)

      // Informações do período com espaçamento menor
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Período: ${dataInicio} a ${dataFim}`, 10, 23)
      doc.text(
        `Data de Geração: ${new Date().toLocaleDateString("pt-BR")}, ${new Date().toLocaleTimeString("pt-BR")}`,
        10,
        28,
      )

      // Resumo financeiro
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("RESUMO FINANCEIRO:", 10, 36)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.text(`Total de Vendas: ${formatCurrency(resumo.totalVendas)}`, 10, 42)
      doc.text(`Quantidade Total Vendida: ${resumo.totalQuantidade} unidades`, 10, 47)
      doc.text(`Total de Transações: ${allData.length}`, 10, 52)

      // Detalhamento das vendas
      doc.setFont("helvetica", "bold")
      doc.setFontSize(11)
      doc.text("DETALHAMENTO DAS VENDAS:", 10, 60)

      // Cabeçalho da tabela
      let yPosition = 68
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)

      // Desenhar linha do cabeçalho
      doc.line(10, yPosition + 2, 200, yPosition + 2)

      // Cabeçalhos das colunas (com "Tipo" adicionado)
      doc.text("Data/Hora", 12, yPosition)
      doc.text("Produto", 40, yPosition)
      doc.text("Tipo", 85, yPosition)
      doc.text("Responsável", 105, yPosition)
      doc.text("Qtd", 145, yPosition)
      doc.text("Valor Unit.", 160, yPosition)
      doc.text("Valor Total", 180, yPosition)

      yPosition += 4
      doc.line(10, yPosition, 200, yPosition)
      yPosition += 3

      // Dados da tabela
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)

      allData.forEach((mov: any, index) => {
        if (yPosition > 275) {
          // Nova página se necessário
          doc.addPage()
          yPosition = 20

          // Repetir cabeçalho na nova página
          doc.setFont("helvetica", "bold")
          doc.setFontSize(9)
          doc.line(10, yPosition, 200, yPosition)
          yPosition += 2
          doc.text("Data/Hora", 12, yPosition)
          doc.text("Produto", 40, yPosition)
          doc.text("Tipo", 85, yPosition)
          doc.text("Responsável", 105, yPosition)
          doc.text("Qtd", 145, yPosition)
          doc.text("Valor Unit.", 160, yPosition)
          doc.text("Valor Total", 180, yPosition)
          yPosition += 4
          doc.line(10, yPosition, 200, yPosition)
          yPosition += 3
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
        }

        const valorUnitario = mov.produtos?.preco_venda || 0
        const valorTotal = valorUnitario * mov.quantidade
        const responsavel = mov.funcionarios?.nome || "N/A"
        const tipoMovimentacao = mov.tipo === "entrada" ? "Entrada" : "Saída"

        // Linha de dados
        doc.text(formatDate(mov.created_at), 12, yPosition)

        // Truncar nome do produto se muito longo
        const produtoNome = mov.produtos?.nome || "N/A"
        const produtoTruncado = produtoNome.length > 20 ? produtoNome.substring(0, 20) + "..." : produtoNome
        doc.text(produtoTruncado, 40, yPosition)

        // Tipo de movimentação
        doc.text(tipoMovimentacao, 85, yPosition)

        // Truncar nome do responsável se muito longo
        const responsavelTruncado = responsavel.length > 12 ? responsavel.substring(0, 12) + "..." : responsavel
        doc.text(responsavelTruncado, 105, yPosition)

        doc.text(mov.quantidade.toString(), 147, yPosition)
        doc.text(formatCurrency(valorUnitario), 160, yPosition)
        doc.text(formatCurrency(valorTotal), 180, yPosition)

        yPosition += 4

        // Linha separadora a cada linha
        if (index < allData.length - 1) {
          doc.line(10, yPosition - 1, 200, yPosition - 1)
        }
      })

      // Linha final da tabela
      doc.line(10, yPosition, 200, yPosition)

      // Rodapé com margem reduzida
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(7)
        doc.text(`Página ${i} de ${totalPages} - CPB Stock`, 10, 290)
      }

      // Salvar o PDF
      const fileName = `relatorio-financeiro-${dataInicio}-${dataFim}.pdf`
      doc.save(fileName)

      toast({
        title: "Relatório exportado",
        description: "O relatório foi baixado em formato PDF com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: `Não foi possível exportar o relatório: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
        variant: "destructive",
      })
    } finally {
      setExportingPDF(false)
    }
  }

  // Renderiza os números de página para a paginação
  const renderPagination = () => {
    const pages: React.ReactNode[] = []
    const maxVisiblePages = 5

    if (totalPages <= 1) return pages

    // Sempre mostrar a primeira página
    pages.push(
      <Button
        key="first"
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => setCurrentPage(1)}
        className="w-8 h-8 p-0"
      >
        1
      </Button>,
    )

    // Calcular o intervalo de páginas a mostrar
    let startPage = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 3)

    // Ajustar o início se estiver muito próximo do final
    if (endPage - startPage < maxVisiblePages - 3 && startPage > 2) {
      startPage = Math.max(2, endPage - (maxVisiblePages - 3))
    }

    // Adicionar elipses se necessário
    if (startPage > 2) {
      pages.push(
        <span key="ellipsis1" className="px-2">
          ...
        </span>,
      )
    }

    // Adicionar páginas intermediárias
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(i)}
          className="w-8 h-8 p-0"
        >
          {i}
        </Button>,
      )
    }

    // Adicionar elipses finais se necessário
    if (endPage < totalPages - 1) {
      pages.push(
        <span key="ellipsis2" className="px-2">
          ...
        </span>,
      )
    }

    // Sempre mostrar a última página se houver mais de uma página
    if (totalPages > 1) {
      pages.push(
        <Button
          key="last"
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => setCurrentPage(totalPages)}
          className="w-8 h-8 p-0"
        >
          {totalPages}
        </Button>,
      )
    }

    return pages
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
        <p className="text-sm md:text-base text-gray-600">Análise de vendas e faturamento</p>
      </div>

      {/* Botão de filtro para mobile */}
      <div className="flex justify-between items-center mb-4 md:hidden">
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Ocultar Filtros" : "Mostrar Filtros"}
        </Button>
        <Button onClick={exportarRelatorio} disabled={exportingPDF}>
          <Download className="h-4 w-4 mr-2" />
          {exportingPDF ? "Gerando..." : "PDF"}
        </Button>
      </div>

      {/* Filtros - visíveis em desktop ou quando expandidos em mobile */}
      <Card className={`mb-6 ${showFilters ? "block" : "hidden md:block"}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Período Rápido</Label>
              <Select value={periodo} onValueChange={handlePeriodoChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="ano">Este Ano</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input id="dataInicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input id="dataFim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>

            <div className="space-y-2 hidden md:block">
              <Label>&nbsp;</Label>
              <Button onClick={exportarRelatorio} className="w-full" disabled={exportingPDF}>
                <Download className="h-4 w-4 mr-2" />
                {exportingPDF ? "Gerando PDF..." : "Exportar PDF"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(resumo.totalVendas)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Itens Vendidos</p>
                <p className="text-2xl font-bold text-purple-600">{resumo.totalQuantidade}</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Movimentações */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento das Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {movimentacoes.length > 0 ? (
            <div className="space-y-3">
              {movimentacoes.map((mov) => (
                <div key={mov.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{mov.produto_nome}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {mov.produto_codigo}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{formatDate(mov.data)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {mov.quantidade} un × {formatCurrency(mov.valor_unitario)}
                    </p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(mov.valor_total)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma venda encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Não há vendas registradas no período selecionado.</p>
              <Button variant="outline" className="mt-4" onClick={() => setPeriodo("mes")}>
                Ver vendas do mês
              </Button>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {renderPagination()}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
