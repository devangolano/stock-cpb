"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Categoria } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, FolderOpen } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function Categorias() {
  const { toast } = useToast()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [novaCategoria, setNovaCategoria] = useState<Partial<Categoria>>({
    nome: "",
    descricao: "",
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadCategorias()
  }, [currentPage])

  const loadCategorias = async () => {
    try {
      // Primeiro, obter a contagem total para paginação
      const { count, error: countError } = await supabase
        .from("categorias")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true)

      if (countError) throw countError

      // Calcular total de páginas
      const total = count || 0
      setTotalPages(Math.ceil(total / itemsPerPage))

      // Buscar os dados paginados
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .eq("ativo", true)
        .order("nome")
        .range(from, to)

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error("Erro ao carregar categorias:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNovaCategoria({
      ...novaCategoria,
      [name]: value,
    })
  }

  const resetForm = () => {
    setNovaCategoria({
      nome: "",
      descricao: "",
    })
    setEditMode(false)
    setCurrentId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editMode && currentId) {
        const { error } = await supabase.from("categorias").update(novaCategoria).eq("id", currentId)

        if (error) throw error

        toast({
          title: "Categoria atualizada",
          description: "A categoria foi atualizada com sucesso.",
        })
      } else {
        const { error } = await supabase.from("categorias").insert([novaCategoria])

        if (error) throw error

        toast({
          title: "Categoria cadastrada",
          description: "A categoria foi cadastrada com sucesso.",
        })
      }

      loadCategorias()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar categoria:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a categoria.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (categoria: Categoria) => {
    setNovaCategoria({
      nome: categoria.nome,
      descricao: categoria.descricao,
    })
    setEditMode(true)
    setCurrentId(categoria.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, nome: string) => {
    try {
      const { error } = await supabase.from("categorias").update({ ativo: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Categoria excluída",
        description: `A categoria "${nome}" foi excluída com sucesso.`,
      })

      loadCategorias()
    } catch (error) {
      console.error("Erro ao excluir categoria:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a categoria.",
        variant: "destructive",
      })
    }
  }

  const filteredCategorias = categorias.filter(
    (categoria) =>
      categoria.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (categoria.descricao && categoria.descricao.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Renderiza os números de página para a paginação
  const renderPagination = () => {
    const pages = []
    const maxVisiblePages = 5

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
      <div className="p-4 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-sm md:text-base text-gray-600">{categorias.length} categorias cadastradas</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>{editMode ? "Editar Categoria" : "Cadastrar Nova Categoria"}</DialogTitle>
              <DialogDescription>
                {editMode
                  ? "Edite os dados da categoria selecionada."
                  : "Preencha os dados para cadastrar uma nova categoria."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome da Categoria*</Label>
                  <Input id="nome" name="nome" value={novaCategoria.nome} onChange={handleInputChange} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    name="descricao"
                    value={novaCategoria.descricao}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button type="submit" className="w-full sm:w-auto">
                  {editMode ? "Salvar Alterações" : "Cadastrar Categoria"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {filteredCategorias.length > 0 ? (
          filteredCategorias.map((categoria) => (
            <Card key={categoria.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{categoria.nome}</h3>
                    <p className="text-xs text-gray-600 mt-1">{categoria.descricao || "Sem descrição"}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(categoria)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir a categoria "{categoria.nome}"? Esta ação não pode ser
                          desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(categoria.id, categoria.nome)}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">Adicione uma nova categoria para começar.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategorias.length > 0 ? (
              filteredCategorias.map((categoria) => (
                <TableRow key={categoria.id}>
                  <TableCell className="font-medium">{categoria.nome}</TableCell>
                  <TableCell>{categoria.descricao || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(categoria)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir a categoria "{categoria.nome}"? Esta ação não pode ser
                              desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(categoria.id, categoria.nome)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma categoria encontrada</h3>
                  <p className="mt-1 text-sm text-gray-500">Adicione uma nova categoria para começar.</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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
            &lt;
          </Button>

          {renderPagination()}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            &gt;
          </Button>
        </div>
      )}
    </div>
  )
}
