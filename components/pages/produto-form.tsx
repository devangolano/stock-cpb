"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Produto, type Categoria, type Prateleira } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProdutoFormProps {
  produtoId?: string
  onBack: () => void
  onSave: () => void
}

export function ProdutoForm({ produtoId, onBack, onSave }: ProdutoFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [prateleiras, setPrateleiras] = useState<Prateleira[]>([])
  const [produto, setProduto] = useState<Partial<Produto>>({
    codigo: "",
    nome: "",
    categoria_id: "",
    marca: "",
    preco_custo: 0,
    preco_venda: 0,
    estoque_loja: 0,
    estoque_armazem: 0,
    estoque_minimo: 0,
    prateleira: "",
  })

  const isEdit = !!produtoId

  useEffect(() => {
    loadCategorias()
    loadPrateleiras()
    if (produtoId) {
      loadProduto()
    }
  }, [produtoId])

  const loadProduto = async () => {
    if (!produtoId) return

    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from("produtos").select("*").eq("id", produtoId).single()

      if (error) throw error

      setProduto(data)
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar produto"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto.",
        variant: "destructive",
      })
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

  const loadPrateleiras = async () => {
    try {
      const { data, error } = await supabase.from("prateleiras").select("*").eq("ativo", true).order("numero")

      if (error) throw error
      setPrateleiras(data || [])
    } catch (error) {
      console.error("Erro ao carregar prateleiras:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (
      name === "preco_custo" ||
      name === "preco_venda" ||
      name === "estoque_loja" ||
      name === "estoque_armazem" ||
      name === "estoque_minimo"
    ) {
      const numericValue = value === "" ? 0 : Number.parseFloat(value)
      setProduto((prev) => ({
        ...prev,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      }))
    } else {
      setProduto((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
    setError(null) // Limpar erro ao digitar
  }

  const handleSelectChange = (name: string, value: string) => {
    // Não definir como "default" se for esse valor
    const finalValue = value === "default" ? "" : value
    setProduto((prev) => ({
      ...prev,
      [name]: finalValue,
    }))
    setError(null)
  }

  const validateForm = (): string | null => {
    if (!produto.codigo?.trim()) {
      return "O código do produto é obrigatório"
    }

    if (!produto.nome?.trim()) {
      return "O nome do produto é obrigatório"
    }

    if (!produto.categoria_id) {
      return "A categoria é obrigatória"
    }

    // Validar formato do código (3 letras + 2 números)
    const codigoRegex = /^[A-Za-z]{3}[0-9]{2}$/
    if (!codigoRegex.test(produto.codigo)) {
      return "O código deve ter 3 letras seguidas de 2 números (ex: ABC01)"
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar formulário
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      // Scroll para o topo para mostrar o erro em mobile
      window.scrollTo({ top: 0, behavior: "smooth" })
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Preparar dados para salvar (remover campos undefined)
      const produtoData = {
        codigo: produto.codigo?.trim(),
        nome: produto.nome?.trim(),
        categoria_id: produto.categoria_id,
        marca: produto.marca?.trim() || null,
        preco_custo: produto.preco_custo || 0,
        preco_venda: produto.preco_venda || 0,
        estoque_loja: produto.estoque_loja || 0,
        estoque_armazem: produto.estoque_armazem || 0,
        estoque_minimo: produto.estoque_minimo || 0,
        prateleira: produto.prateleira || null,
        ativo: true,
      }

      if (isEdit && produtoId) {
        const { error } = await supabase.from("produtos").update(produtoData).eq("id", produtoId)

        if (error) throw error

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase.from("produtos").insert([produtoData])

        if (error) throw error

        toast({
          title: "Produto cadastrado",
          description: "O produto foi cadastrado com sucesso.",
        })
      }

      onSave()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar produto"
      setError(errorMessage)
      // Scroll para o topo para mostrar o erro em mobile
      window.scrollTo({ top: 0, behavior: "smooth" })
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Verificar se o formulário é válido
  const isFormValid = produto.codigo?.trim() && produto.nome?.trim() && produto.categoria_id

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-3 md:p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="outline" onClick={onBack} className="mb-4" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{isEdit ? "Editar Produto" : "Novo Produto"}</h1>
          <p className="text-sm md:text-base text-gray-600">
            {isEdit ? "Edite os dados do produto" : "Preencha os dados para cadastrar um novo produto"}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Código e Nome - sempre em coluna única no mobile */}
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo" className="text-sm font-medium">
                    Código do Produto*
                  </Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    value={produto.codigo || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Ex: CAN01"
                    maxLength={5}
                    disabled={loading}
                    className={`h-11 ${error && !produto.codigo?.trim() ? "border-red-500" : ""}`}
                  />
                  <p className="text-xs text-gray-500">3 letras + 2 números (ex: ABC01)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-medium">
                    Nome do Produto*
                  </Label>
                  <Input
                    id="nome"
                    name="nome"
                    value={produto.nome || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Nome do produto"
                    disabled={loading}
                    className={`h-11 ${error && !produto.nome?.trim() ? "border-red-500" : ""}`}
                  />
                </div>
              </div>

              {/* Categoria e Marca */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria_id" className="text-sm font-medium">
                    Categoria*
                  </Label>
                  <Select
                    value={produto.categoria_id || "default"}
                    onValueChange={(value) => handleSelectChange("categoria_id", value)}
                    disabled={loading}
                  >
                    <SelectTrigger className={`h-11 ${error && !produto.categoria_id ? "border-red-500" : ""}`}>
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
                  {categorias.length === 0 && (
                    <p className="text-xs text-amber-600">
                      Nenhuma categoria encontrada. Cadastre uma categoria primeiro.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marca" className="text-sm font-medium">
                    Marca
                  </Label>
                  <Input
                    id="marca"
                    name="marca"
                    value={produto.marca || ""}
                    onChange={handleInputChange}
                    placeholder="Marca do produto"
                    disabled={loading}
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preços */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Preços</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco_custo" className="text-sm font-medium">
                  Preço de Custo (Kz)
                </Label>
                <Input
                  id="preco_custo"
                  name="preco_custo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={produto.preco_custo || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Valor pago ao fornecedor (opcional)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_venda" className="text-sm font-medium">
                  Preço de Venda (Kz)
                </Label>
                <Input
                  id="preco_venda"
                  name="preco_venda"
                  type="number"
                  step="0.01"
                  min="0"
                  value={produto.preco_venda || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Valor de venda ao cliente (opcional)</p>
              </div>
            </CardContent>
          </Card>

          {/* Estoque */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Controle de Estoque</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estoque_loja" className="text-sm font-medium">
                  Estoque Loja
                </Label>
                <Input
                  id="estoque_loja"
                  name="estoque_loja"
                  type="number"
                  min="0"
                  value={produto.estoque_loja || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Quantidade na loja</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_armazem" className="text-sm font-medium">
                  Estoque Armazém
                </Label>
                <Input
                  id="estoque_armazem"
                  name="estoque_armazem"
                  type="number"
                  min="0"
                  value={produto.estoque_armazem || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Quantidade no armazém</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estoque_minimo" className="text-sm font-medium">
                  Estoque Mínimo
                </Label>
                <Input
                  id="estoque_minimo"
                  name="estoque_minimo"
                  type="number"
                  min="0"
                  value={produto.estoque_minimo || ""}
                  onChange={handleInputChange}
                  placeholder="0"
                  disabled={loading}
                  className="h-11"
                />
                <p className="text-xs text-gray-500">Alerta de estoque baixo</p>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">Localização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="prateleira" className="text-sm font-medium">
                  Prateleira
                </Label>
                <Select
                  value={produto.prateleira || "default"}
                  onValueChange={(value) => handleSelectChange("prateleira", value)}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Selecione uma prateleira" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Nenhuma prateleira</SelectItem>
                    {prateleiras.map((prateleira) => (
                      <SelectItem key={prateleira.id} value={prateleira.numero}>
                        {prateleira.numero}
                        {prateleira.descricao && ` - ${prateleira.descricao}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {prateleiras.length === 0 && (
                  <p className="text-xs text-amber-600">
                    Nenhuma prateleira encontrada. Cadastre prateleiras para organizar os produtos.
                  </p>
                )}
                <p className="text-xs text-gray-500">Localização física do produto (opcional)</p>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação - Fixos na parte inferior em mobile */}
          <div className="sticky bottom-0 bg-gray-50 p-4 -mx-3 md:mx-0 md:relative md:bg-transparent md:p-0">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button type="submit" disabled={loading || !isFormValid} className="h-11 flex-1 sm:flex-none" size="lg">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={loading}
                className="h-11 flex-1 sm:flex-none"
                size="lg"
              >
                Cancelar
              </Button>
            </div>
          </div>

          {/* Espaço extra para evitar que o conteúdo fique atrás dos botões fixos */}
          <div className="h-20 md:h-0"></div>
        </form>
      </div>
    </div>
  )
}
