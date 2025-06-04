"use client"

import { useEffect, useState } from "react"
import { supabase, type Movimentacao, type Produto, type Funcionario } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, Package, User, MapPin, Hash, FileText, MessageSquare } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface MovimentacaoCompleta extends Movimentacao {
  produtos?: Produto
  funcionarios?: Funcionario
}

interface MovimentacaoDetalhesProps {
  movimentacaoId: string
  onBack: () => void
}

export function MovimentacaoDetalhes({ movimentacaoId, onBack }: MovimentacaoDetalhesProps) {
  const { toast } = useToast()
  const [movimentacao, setMovimentacao] = useState<MovimentacaoCompleta | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMovimentacao()
  }, [movimentacaoId])

  const loadMovimentacao = async () => {
    try {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select(`
          *,
          produtos (
            id,
            nome,
            codigo
          ),
          funcionarios (
            id,
            nome
          )
        `)
        .eq("id", movimentacaoId)
        .single()

      if (error) throw error
      setMovimentacao(data)
    } catch (error) {
      console.error("Erro ao carregar movimentação:", error)
      toast({
        title: "Erro",
        description: "Movimentação não encontrada.",
        variant: "destructive",
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm")
    } catch (e) {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!movimentacao) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Movimentação não encontrada</h3>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Detalhes da Movimentação</h1>
            <p className="text-sm md:text-base text-gray-600">
              {movimentacao.produtos?.nome} • {formatDate(movimentacao.created_at)}
            </p>
          </div>
          <Badge variant={movimentacao.tipo === "entrada" ? "default" : "destructive"} className="text-sm">
            {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações do Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Nome</Label>
              <p className="text-sm font-medium">{movimentacao.produtos?.nome}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Código</Label>
              <p className="text-sm">{movimentacao.produtos?.codigo}</p>
            </div>
          </CardContent>
        </Card>

        {/* Detalhes da Movimentação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da Movimentação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Tipo</Label>
              <Badge variant={movimentacao.tipo === "entrada" ? "default" : "destructive"}>
                {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Local</Label>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <Badge variant="outline">{movimentacao.local === "loja" ? "Loja" : "Armazém"}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Quantidade</Label>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-400" />
                <p className="text-sm font-medium">{movimentacao.quantidade} unidades</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Data</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <p className="text-sm">{formatDate(movimentacao.created_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivo e Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Informações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Motivo</Label>
              <p className="text-sm">{movimentacao.motivo || "-"}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Observações</Label>
              <p className="text-sm">{movimentacao.observacoes || "-"}</p>
            </div>
          </CardContent>
        </Card>

        {/* Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Responsável
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Funcionário</Label>
              <p className="text-sm font-medium">{movimentacao.funcionarios?.nome || "-"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
