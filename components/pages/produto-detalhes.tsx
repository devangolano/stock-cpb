"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Produto, type Categoria } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, ArrowRightLeft, Package, AlertTriangle, Store, Warehouse, Save, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ProdutoComCategoria extends Produto {
  categorias?: Categoria
}

interface ProdutoDetalhesProps {
  productId: string
  onBack: () => void
}

export function ProdutoDetalhes({ productId, onBack }: ProdutoDetalhesProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [produto, setProduto] = useState<ProdutoComCategoria | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editedProduct, setEditedProduct] = useState<Partial<Produto>>({})
  const [movimentacaoDialogOpen, setMovimentacaoDialogOpen] = useState(false)
  const [novaMovimentacao, setNovaMovimentacao] = useState({
    produto_id: productId,
    funcionario_id: user?.id || "",
    tipo: "entrada" as "entrada" | "saida",
    local: "loja" as "loja" | "armazem",
    quantidade: 1,
    motivo: "",
    observacoes: "",
  })
  const [isTransferencia, setIsTransferencia] = useState(false)

  const isSupervisor = user?.tipo === "supervisor"

  useEffect(() => {
    loadProduto()
    loadCategorias()
  }, [productId])

  const loadProduto = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select(`
          *,
          categorias (
            id,
            nome
          )
        `)
        .eq("id", productId)
        .eq("ativo", true)
        .single()

      if (error) throw error
      setProduto(data)
      setEditedProduct(data)
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      toast({
        title: "Erro",
        description: "Produto não encontrado.",
        variant: "destructive",
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const loadCategorias = async () => {
    try {
      const { data, error } = await supabase.from("categorias").select("*").eq("ativo", true).order("nome")

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (
      name === "preco_custo" ||
      name === "preco_venda" ||
      name === "estoque_loja" ||
      name === "estoque_armazem" ||
      name === "estoque_minimo"
    ) {
      const numericValue = value === "" ? 0 : Number.parseFloat(value)
      setEditedProduct({
        ...editedProduct,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      })
    } else {
      setEditedProduct({
        ...editedProduct,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setEditedProduct({
      ...editedProduct,
      [name]: value,
    })
  }

  const handleSave = async () => {
    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem editar produtos.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("produtos").update(editedProduct).eq("id", productId)

      if (error) throw error

      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      })

      setEditMode(false)
      loadProduto()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
        variant: "destructive",
      })
    }
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditedProduct(produto || {})
  }

  const handleMovimentacaoInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "quantidade") {
      const numericValue = value === "" ? undefined : Number.parseInt(value)
      setNovaMovimentacao({
        ...novaMovimentacao,
        [name]: isNaN(numericValue as number) ? undefined : numericValue,
      })
    } else {
      setNovaMovimentacao({
        ...novaMovimentacao,
        [name]: value,
      })
    }
  }

  const handleMovimentacaoSelectChange = (name: string, value: string) => {
    if (name === "tipo" && value === "transferencia") {
      setIsTransferencia(true)
      setNovaMovimentacao({
        ...novaMovimentacao,
        tipo: "saida",
        motivo: "Transferência entre locais",
      })
    } else if (name === "tipo") {
      setIsTransferencia(false)
      setNovaMovimentacao({
        ...novaMovimentacao,
        [name]: value as "entrada" | "saida",
      })
    } else {
      setNovaMovimentacao({
        ...novaMovimentacao,
        [name]: value as any,
      })
    }
  }

  const handleMovimentacaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!novaMovimentacao.produto_id || !novaMovimentacao.funcionario_id || !novaMovimentacao.quantidade) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isTransferencia) {
        // Transferência entre locais
        const { error: movError } = await supabase.from("movimentacoes").insert([
          {
            ...novaMovimentacao,
            tipo: "saida",
            motivo: novaMovimentacao.motivo || "Transferência entre locais",
          },
        ])

        if (movError) throw movError

        const destinoLocal = novaMovimentacao.local === "loja" ? "armazem" : "loja"
        const { error: movEntradaError } = await supabase.from("movimentacoes").insert([
          {
            produto_id: novaMovimentacao.produto_id,
            funcionario_id: novaMovimentacao.funcionario_id,
            tipo: "entrada",
            local: destinoLocal,
            quantidade: novaMovimentacao.quantidade,
            motivo: novaMovimentacao.motivo || "Transferência entre locais",
            observacoes: novaMovimentacao.observacoes,
          },
        ])

        if (movEntradaError) throw movEntradaError

        if (produto) {
          const origemField = novaMovimentacao.local === "loja" ? "estoque_loja" : "estoque_armazem"
          const destinoField = novaMovimentacao.local === "loja" ? "estoque_armazem" : "estoque_loja"

          const origemValue = produto[origemField as keyof Produto] as number
          const destinoValue = produto[destinoField as keyof Produto] as number

          const novoOrigemValue = Math.max(0, origemValue - (novaMovimentacao.quantidade || 0))
          const novoDestinoValue = destinoValue + (novaMovimentacao.quantidade || 0)

          const { error: prodError } = await supabase
            .from("produtos")
            .update({
              [origemField]: novoOrigemValue,
              [destinoField]: novoDestinoValue,
            })
            .eq("id", novaMovimentacao.produto_id)

          if (prodError) throw prodError
        }
      } else {
        // Entrada ou saída normal
        const { error: movError } = await supabase.from("movimentacoes").insert([novaMovimentacao])

        if (movError) throw movError

        if (produto) {
          const fieldToUpdate = novaMovimentacao.local === "loja" ? "estoque_loja" : "estoque_armazem"
          const currentValue = produto[fieldToUpdate as keyof Produto] as number
          const newValue =
            novaMovimentacao.tipo === "entrada"
              ? currentValue + (novaMovimentacao.quantidade || 0)
              : Math.max(0, currentValue - (novaMovimentacao.quantidade || 0))

          const { error: prodError } = await supabase
            .from("produtos")
            .update({ [fieldToUpdate]: newValue })
            .eq("id", novaMovimentacao.produto_id)

          if (prodError) throw prodError
        }
      }

      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi registrada com sucesso.",
      })

      setMovimentacaoDialogOpen(false)
      setNovaMovimentacao({
        produto_id: productId,
        funcionario_id: user?.id || "",
        tipo: "entrada",
        local: "loja",
        quantidade: 1,
        motivo: "",
        observacoes: "",
      })
      setIsTransferencia(false)
      loadProduto()
    } catch (error) {
      console.error("Erro ao registrar movimentação:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao registrar a movimentação.",
        variant: "destructive",
      })
    }
  }

  const isAbaixoMinimo = (produto: Produto) => {
    return produto.estoque_loja + produto.estoque_armazem < produto.estoque_minimo
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

  if (!produto) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Produto não encontrado</h3>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">{produto.nome}</h1>
            <p className="text-sm md:text-base text-gray-600">Código: {produto.codigo}</p>
          </div>
          <div className="flex gap-2">
            {!editMode ? (
              <>
                {isSupervisor && (
                  <Button variant="outline" onClick={() => setEditMode(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
                <Button onClick={() => setMovimentacaoDialogOpen(true)}>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Movimentar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Código</Label>
              {editMode ? (
                <Input
                  name="codigo"
                  value={editedProduct.codigo || ""}
                  onChange={handleInputChange}
                  maxLength={5}
                  pattern="[A-Za-z]{3}[0-9]{2}"
                />
              ) : (
                <p className="text-sm font-medium">{produto.codigo}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Nome</Label>
              {editMode ? (
                <Input name="nome" value={editedProduct.nome || ""} onChange={handleInputChange} />
              ) : (
                <p className="text-sm font-medium">{produto.nome}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              {editMode ? (
                <Select
                  value={editedProduct.categoria_id || ""}
                  onValueChange={(value) => handleSelectChange("categoria_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm">{produto.categorias?.nome || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              {editMode ? (
                <Input name="marca" value={editedProduct.marca || ""} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{produto.marca || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Fornecedor</Label>
              {editMode ? (
                <Input name="fornecedor" value={editedProduct.fornecedor || ""} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{produto.fornecedor || "-"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Código de Barras</Label>
              {editMode ? (
                <Input name="codigo_barras" value={editedProduct.codigo_barras || ""} onChange={handleInputChange} />
              ) : (
                <p className="text-sm">{produto.codigo_barras || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preços */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Preços</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preço de Custo</Label>
              {editMode ? (
                <Input
                  name="preco_custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedProduct.preco_custo || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-sm">Kz {(produto.preco_custo || 0).toFixed(2)}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda</Label>
              {editMode ? (
                <Input
                  name="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editedProduct.preco_venda || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-sm font-medium text-green-600">Kz {(produto.preco_venda || 0).toFixed(2)}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5" />
              Controle de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Store className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <Label className="text-sm font-medium text-gray-600">Estoque Loja</Label>
                {editMode ? (
                  <Input
                    name="estoque_loja"
                    type="number"
                    min="0"
                    value={editedProduct.estoque_loja || 0}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-2xl font-bold text-blue-600">{produto.estoque_loja} un</p>
                )}
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Warehouse className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <Label className="text-sm font-medium text-gray-600">Estoque Armazém</Label>
                {editMode ? (
                  <Input
                    name="estoque_armazem"
                    type="number"
                    min="0"
                    value={editedProduct.estoque_armazem || 0}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-2xl font-bold text-green-600">{produto.estoque_armazem} un</p>
                )}
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <Label className="text-sm font-medium text-gray-600">Estoque Mínimo</Label>
                {editMode ? (
                  <Input
                    name="estoque_minimo"
                    type="number"
                    min="0"
                    value={editedProduct.estoque_minimo || 0}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                ) : (
                  <p className="text-2xl font-bold text-orange-600">{produto.estoque_minimo} un</p>
                )}
              </div>
            </div>

            {!editMode && (
              <>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Total em Estoque</span>
                    <span className="text-lg font-bold">{produto.estoque_loja + produto.estoque_armazem} unidades</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full ${isAbaixoMinimo(produto) ? "bg-red-500" : "bg-green-500"}`}
                      style={{
                        width: `${Math.min(
                          100,
                          ((produto.estoque_loja + produto.estoque_armazem) / produto.estoque_minimo) * 100,
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {isAbaixoMinimo(produto) && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">Estoque abaixo do mínimo!</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      Total: {produto.estoque_loja + produto.estoque_armazem} un | Mínimo: {produto.estoque_minimo} un
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Prateleira</Label>
              {editMode ? (
                <Input
                  name="prateleira"
                  value={editedProduct.prateleira || ""}
                  onChange={handleInputChange}
                  placeholder="Ex: Prat 01"
                />
              ) : (
                <p className="text-sm">{produto.prateleira || "-"}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Movimentação */}
      <Dialog
        open={movimentacaoDialogOpen}
        onOpenChange={(open) => {
          setMovimentacaoDialogOpen(open)
          if (!open) {
            setNovaMovimentacao({
              produto_id: productId,
              funcionario_id: user?.id || "",
              tipo: "entrada",
              local: "loja",
              quantidade: 1,
              motivo: "",
              observacoes: "",
            })
            setIsTransferencia(false)
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Movimentar Produto</DialogTitle>
            <DialogDescription>Registre uma movimentação para o produto: {produto.nome}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovimentacaoSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo*</Label>
                  <Select
                    value={isTransferencia ? "transferencia" : novaMovimentacao.tipo}
                    onValueChange={(value) => handleMovimentacaoSelectChange("tipo", value)}
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
                    value={novaMovimentacao.local}
                    onValueChange={(value) => handleMovimentacaoSelectChange("local", value)}
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
                  value={novaMovimentacao.quantidade || ""}
                  onChange={handleMovimentacaoInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Input
                  id="motivo"
                  name="motivo"
                  placeholder="Ex: Compra, Venda, Ajuste de estoque"
                  value={novaMovimentacao.motivo}
                  onChange={handleMovimentacaoInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={novaMovimentacao.observacoes}
                  onChange={handleMovimentacaoInputChange}
                />
              </div>

              <div className="p-3 bg-gray-50 rounded-md text-sm">
                <p className="font-medium">Estoque atual:</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-gray-600">Loja: </span>
                    <span className="font-medium">{produto.estoque_loja || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Armazém: </span>
                    <span className="font-medium">{produto.estoque_armazem || 0}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="submit" className="w-full sm:w-auto">
                {isTransferencia ? "Registrar Transferência" : "Registrar Movimentação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
