"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Produto, type Movimentacao } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Command, CommandList, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface MovimentacaoFormProps {
  onBack: () => void
  onSave: () => void
}

export function MovimentacaoForm({ onBack, onSave }: MovimentacaoFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Produto | null>(null)
  const [produtoOpen, setProdutoOpen] = useState(false)
  const [isTransferencia, setIsTransferencia] = useState(false)
  const [movimentacao, setMovimentacao] = useState<Partial<Movimentacao>>({
    produto_id: "",
    funcionario_id: user?.id || "",
    tipo: "entrada",
    local: "loja",
    quantidade: 1,
    motivo: "",
    observacoes: "",
  })

  useEffect(() => {
    loadProdutos()
  }, [])

  const loadProdutos = async () => {
    try {
      const { data, error } = await supabase.from("produtos").select("*").eq("ativo", true).order("nome")

      if (error) throw error
      setProdutos(data || [])
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "quantidade") {
      const numericValue = value === "" ? undefined : Number.parseInt(value)
      setMovimentacao({
        ...movimentacao,
        [name]: isNaN(numericValue as number) ? undefined : numericValue,
      })
    } else {
      setMovimentacao({
        ...movimentacao,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    if (name === "produto_id") {
      const produto = produtos.find((p) => p.id === value)
      setSelectedProduct(produto || null)
    }

    if (name === "tipo" && value === "transferencia") {
      setIsTransferencia(true)
      setMovimentacao({
        ...movimentacao,
        tipo: "saida",
        motivo: "Transferência entre locais",
      })
    } else if (name === "tipo") {
      setIsTransferencia(false)
      setMovimentacao({
        ...movimentacao,
        [name]: value as "entrada" | "saida",
      })
    } else {
      setMovimentacao({
        ...movimentacao,
        [name]: value as any,
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!movimentacao.produto_id || !movimentacao.funcionario_id || !movimentacao.quantidade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      if (isTransferencia) {
        // Caso seja transferência, precisamos fazer duas operações:
        // 1. Saída do local de origem
        const { error: movError } = await supabase.from("movimentacoes").insert([
          {
            ...movimentacao,
            tipo: "saida",
            motivo: movimentacao.motivo || "Transferência entre locais",
          },
        ])

        if (movError) throw movError

        // 2. Entrada no local de destino
        const destinoLocal = movimentacao.local === "loja" ? "armazem" : "loja"
        const { error: movEntradaError } = await supabase.from("movimentacoes").insert([
          {
            produto_id: movimentacao.produto_id,
            funcionario_id: movimentacao.funcionario_id,
            tipo: "entrada",
            local: destinoLocal,
            quantidade: movimentacao.quantidade,
            motivo: movimentacao.motivo || "Transferência entre locais",
            observacoes: movimentacao.observacoes,
          },
        ])

        if (movEntradaError) throw movEntradaError

        // 3. Atualizar o estoque do produto
        if (selectedProduct) {
          const origemField = movimentacao.local === "loja" ? "estoque_loja" : "estoque_armazem"
          const destinoField = movimentacao.local === "loja" ? "estoque_armazem" : "estoque_loja"

          const origemValue = selectedProduct[origemField as keyof Produto] as number
          const destinoValue = selectedProduct[destinoField as keyof Produto] as number

          const novoOrigemValue = Math.max(0, origemValue - (movimentacao.quantidade || 0))
          const novoDestinoValue = destinoValue + (movimentacao.quantidade || 0)

          const { error: prodError } = await supabase
            .from("produtos")
            .update({
              [origemField]: novoOrigemValue,
              [destinoField]: novoDestinoValue,
            })
            .eq("id", movimentacao.produto_id)

          if (prodError) throw prodError
        }
      } else {
        // Caso normal (entrada ou saída)
        const { error: movError } = await supabase.from("movimentacoes").insert([movimentacao])

        if (movError) throw movError

        // Atualizar o estoque do produto
        if (selectedProduct) {
          const fieldToUpdate = movimentacao.local === "loja" ? "estoque_loja" : "estoque_armazem"
          const currentValue = selectedProduct[fieldToUpdate as keyof Produto] as number
          const newValue =
            movimentacao.tipo === "entrada"
              ? currentValue + (movimentacao.quantidade || 0)
              : Math.max(0, currentValue - (movimentacao.quantidade || 0))

          const { error: prodError } = await supabase
            .from("produtos")
            .update({ [fieldToUpdate]: newValue })
            .eq("id", movimentacao.produto_id)

          if (prodError) throw prodError
        }
      }

      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi registrada com sucesso.",
      })

      onSave()
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Nova Movimentação</h1>
        <p className="text-sm md:text-base text-gray-600">Registre uma entrada ou saída de produtos no estoque</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Movimentação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="produto_id">Produto*</Label>
              <Popover open={produtoOpen} onOpenChange={setProdutoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={produtoOpen}
                    className="w-full justify-between"
                    disabled={loading}
                  >
                    {movimentacao.produto_id
                      ? produtos.find((produto) => produto.id === movimentacao.produto_id)?.nome
                      : "Selecione um produto"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Buscar produto..." />
                    <CommandList>
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {produtos.map((produto) => (
                          <CommandItem
                            key={produto.id}
                            value={produto.nome}
                            onSelect={() => {
                              handleSelectChange("produto_id", produto.id)
                              setProdutoOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                movimentacao.produto_id === produto.id ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <span className="font-medium">{produto.nome}</span>
                            <span className="ml-2 text-xs text-muted-foreground">Cód: {produto.codigo}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo*</Label>
                <Select
                  value={isTransferencia ? "transferencia" : movimentacao.tipo || "entrada"}
                  onValueChange={(value) => handleSelectChange("tipo", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="local">{isTransferencia ? "Local de Origem" : "Local"}*</Label>
                <Select
                  value={movimentacao.local || "loja"}
                  onValueChange={(value) => handleSelectChange("local", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Local" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loja">Loja</SelectItem>
                    <SelectItem value="armazem">Armazém</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade*</Label>
              <Input
                id="quantidade"
                name="quantidade"
                type="number"
                min="1"
                value={movimentacao.quantidade || ""}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                name="motivo"
                placeholder="Ex: Compra, Venda, Ajuste de estoque"
                value={movimentacao.motivo || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                name="observacoes"
                rows={3}
                value={movimentacao.observacoes || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium">Estoque atual:</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-gray-600">Loja: </span>
                    <span className="font-medium">{selectedProduct.estoque_loja || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Armazém: </span>
                    <span className="font-medium">{selectedProduct.estoque_armazem || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Registrando..." : isTransferencia ? "Registrar Transferência" : "Registrar Movimentação"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
