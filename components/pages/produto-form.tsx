"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Produto, type Categoria } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ProdutoFormProps {
  produtoId?: string
  onBack: () => void
  onSave: () => void
}

export function ProdutoForm({ produtoId, onBack, onSave }: ProdutoFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [produto, setProduto] = useState<Partial<Produto>>({
    codigo: "",
    nome: "",
    categoria_id: "",
    marca: "",
    fornecedor: "",
    preco_custo: 0,
    preco_venda: 0,
    estoque_loja: 0,
    estoque_armazem: 0,
    estoque_minimo: 0,
    prateleira: "",
    codigo_barras: "",
  })

  const isEdit = !!produtoId
  const isSupervisor = user?.tipo === "supervisor"

  useEffect(() => {
    loadCategorias()
    if (produtoId) {
      loadProduto()
    }
  }, [produtoId])

  const loadProduto = async () => {
    if (!produtoId) return

    try {
      setLoading(true)
      const { data, error } = await supabase.from("produtos").select("*").eq("id", produtoId).single()

      if (error) throw error

      setProduto(data)
    } catch (error) {
      console.error("Erro ao carregar produto:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto.",
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
      setProduto({
        ...produto,
        [name]: isNaN(numericValue) ? 0 : numericValue,
      })
    } else {
      setProduto({
        ...produto,
        [name]: value,
      })
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setProduto({
      ...produto,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setLoading(true)

      if (isEdit) {
        const { error } = await supabase.from("produtos").update(produto).eq("id", produtoId)

        if (error) throw error

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase.from("produtos").insert([produto])

        if (error) throw error

        toast({
          title: "Produto cadastrado",
          description: "O produto foi cadastrado com sucesso.",
        })
      }

      onSave()
    } catch (error) {
      console.error("Erro ao salvar produto:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o produto.",
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">{isEdit ? "Editar Produto" : "Novo Produto"}</h1>
        <p className="text-sm md:text-base text-gray-600">
          {isEdit ? "Edite os dados do produto" : "Preencha os dados para cadastrar um novo produto"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código do Produto*</Label>
              <Input
                id="codigo"
                name="codigo"
                value={produto.codigo || ""}
                onChange={handleInputChange}
                required
                placeholder="Ex: CAN01"
                maxLength={5}
                pattern="[A-Za-z]{3}[0-9]{2}"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Produto*</Label>
              <Input
                id="nome"
                name="nome"
                value={produto.nome || ""}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria_id">Categoria*</Label>
              <Select
                value={produto.categoria_id || ""}
                onValueChange={(value) => handleSelectChange("categoria_id", value)}
                disabled={loading}
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                name="marca"
                value={produto.marca || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor</Label>
              <Input
                id="fornecedor"
                name="fornecedor"
                value={produto.fornecedor || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo_barras">Código de Barras</Label>
              <Input
                id="codigo_barras"
                name="codigo_barras"
                value={produto.codigo_barras || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
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
              <Label htmlFor="preco_custo">Preço de Custo (Kz)</Label>
              <Input
                id="preco_custo"
                name="preco_custo"
                type="number"
                step="0.01"
                min="0"
                value={produto.preco_custo || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de Venda (Kz)*</Label>
              <Input
                id="preco_venda"
                name="preco_venda"
                type="number"
                step="0.01"
                min="0"
                value={produto.preco_venda || 0}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Controle de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estoque_loja">Estoque Loja</Label>
              <Input
                id="estoque_loja"
                name="estoque_loja"
                type="number"
                min="0"
                value={produto.estoque_loja || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_armazem">Estoque Armazém</Label>
              <Input
                id="estoque_armazem"
                name="estoque_armazem"
                type="number"
                min="0"
                value={produto.estoque_armazem || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
              <Input
                id="estoque_minimo"
                name="estoque_minimo"
                type="number"
                min="0"
                value={produto.estoque_minimo || 0}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        {/* Localização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Localização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="prateleira">Prateleira</Label>
              <Input
                id="prateleira"
                name="prateleira"
                placeholder="Ex: Prat 01"
                value={produto.prateleira || ""}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
          </Button>
          <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
