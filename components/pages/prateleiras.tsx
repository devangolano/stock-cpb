"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Prateleira } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Grid3X3, AlertCircle } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"

export function Prateleiras() {
  const { toast } = useToast()
  const { user } = useAuth()
  const [prateleiras, setPrateleiras] = useState<Prateleira[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [novaPrateleira, setNovaPrateleira] = useState<Partial<Prateleira>>({
    numero: "",
    descricao: "",
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)

  const isSupervisor = user?.tipo === "supervisor"

  useEffect(() => {
    loadPrateleiras()
  }, [])

  const loadPrateleiras = async () => {
    try {
      setError(null)

      const { data, error: prateleirasError } = await supabase
        .from("prateleiras")
        .select("*")
        .eq("ativo", true)
        .order("numero")

      if (prateleirasError) {
        console.error("Erro ao carregar prateleiras:", prateleirasError)

        if (prateleirasError.message?.includes("does not exist")) {
          setError("A tabela de prateleiras não foi encontrada. Execute o script de configuração primeiro.")
        } else {
          setError("Erro ao carregar prateleiras. Tente novamente.")
        }

        setPrateleiras([])
        return
      }

      setPrateleiras(data || [])
    } catch (error) {
      console.error("Erro ao carregar prateleiras:", error)
      setError("Erro inesperado ao carregar prateleiras.")
      toast({
        title: "Erro",
        description: "Não foi possível carregar as prateleiras.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNovaPrateleira({
      ...novaPrateleira,
      [name]: value,
    })
  }

  const resetForm = () => {
    setNovaPrateleira({
      numero: "",
      descricao: "",
    })
    setEditMode(false)
    setCurrentId(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem criar/editar prateleiras.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editMode && currentId) {
        const { error } = await supabase.from("prateleiras").update(novaPrateleira).eq("id", currentId)

        if (error) throw error

        toast({
          title: "Prateleira atualizada",
          description: "A prateleira foi atualizada com sucesso.",
        })
      } else {
        const { error } = await supabase.from("prateleiras").insert([novaPrateleira])

        if (error) throw error

        toast({
          title: "Prateleira cadastrada",
          description: "A prateleira foi cadastrada com sucesso.",
        })
      }

      loadPrateleiras()
      setDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Erro ao salvar prateleira:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a prateleira.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (prateleira: Prateleira) => {
    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem editar prateleiras.",
        variant: "destructive",
      })
      return
    }

    setNovaPrateleira({
      numero: prateleira.numero,
      descricao: prateleira.descricao,
    })
    setEditMode(true)
    setCurrentId(prateleira.id)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, numero: string) => {
    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem excluir prateleiras.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("prateleiras").update({ ativo: false }).eq("id", id)

      if (error) throw error

      toast({
        title: "Prateleira excluída",
        description: `A prateleira "${numero}" foi excluída com sucesso.`,
      })

      loadPrateleiras()
    } catch (error) {
      console.error("Erro ao excluir prateleira:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir a prateleira.",
        variant: "destructive",
      })
    }
  }

  const filteredPrateleiras = prateleiras.filter(
    (prateleira) =>
      prateleira.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (prateleira.descricao && prateleira.descricao.toLowerCase().includes(searchTerm.toLowerCase())),
  )

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

  return (
    <div className="p-3 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Prateleiras</h1>
          <p className="text-sm md:text-base text-gray-600">{prateleiras.length} prateleiras cadastradas</p>
        </div>
        {isSupervisor && (
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
                Nova Prateleira
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editMode ? "Editar Prateleira" : "Cadastrar Nova Prateleira"}</DialogTitle>
                <DialogDescription>
                  {editMode
                    ? "Edite os dados da prateleira selecionada."
                    : "Preencha os dados para cadastrar uma nova prateleira."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número da Prateleira*</Label>
                    <Input
                      id="numero"
                      name="numero"
                      value={novaPrateleira.numero || ""}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: Prat 01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      name="descricao"
                      value={novaPrateleira.descricao || ""}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="Descrição da prateleira..."
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    {editMode ? "Salvar Alterações" : "Cadastrar Prateleira"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar prateleiras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid de Prateleiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPrateleiras.length > 0 ? (
          filteredPrateleiras.map((prateleira) => (
            <Card key={prateleira.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg truncate">{prateleira.numero}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prateleira.descricao || "Sem descrição"}</p>
                  </div>
                </div>
                {isSupervisor && (
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(prateleira)}>
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
                            Tem certeza que deseja excluir a prateleira "{prateleira.numero}"? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(prateleira.id, prateleira.numero)}
                            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="text-center py-8">
                <Grid3X3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma prateleira encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {isSupervisor ? "Adicione uma nova prateleira para começar." : "Nenhuma prateleira cadastrada."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
