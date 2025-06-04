"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Funcionario } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Search, Edit, Trash2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
// import { handleToggleStatus } from "@/utils/functions" // Import handleToggleStatus

interface FuncionariosProps {
  onNavigateToCreate: () => void
  onNavigateToEdit: (funcionarioId: string) => void
}

export function Funcionarios({ onNavigateToCreate, onNavigateToEdit }: FuncionariosProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [novoFuncionario, setNovoFuncionario] = useState<Partial<Funcionario>>({
    nome: "",
    telefone: "",
    senha: "",
    tipo: "funcionario",
    ativo: true,
  })
  const [showPassword, setShowPassword] = useState(false)

  const isSupervisor = user?.tipo === "supervisor"

  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    loadFuncionarios()
  }, [currentPage])

  const loadFuncionarios = async () => {
    try {
      // Primeiro, obter a contagem total para paginação
      const { count, error: countError } = await supabase
        .from("funcionarios")
        .select("*", { count: "exact", head: true })

      if (countError) throw countError

      // Calcular total de páginas
      const total = count || 0
      setTotalPages(Math.ceil(total / itemsPerPage))

      // Buscar os dados paginados
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error } = await supabase.from("funcionarios").select("*").order("nome").range(from, to)

      if (error) throw error
      setFuncionarios(data || [])
    } catch (error) {
      console.error("Erro ao carregar funcionários:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setNovoFuncionario({
      ...novoFuncionario,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setNovoFuncionario({
      ...novoFuncionario,
      [name]: value,
    })
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem alterar status de funcionários.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("funcionarios").update({ ativo: !currentStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: "Status alterado",
        description: `Funcionário ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      })

      loadFuncionarios()
    } catch (error) {
      console.error("Erro ao alterar status do funcionário:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao alterar o status do funcionário.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setNovoFuncionario({
      nome: "",
      telefone: "",
      senha: "",
      tipo: "funcionario",
      ativo: true,
    })
  }

  const handleDelete = async (id: string, nome: string) => {
    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem excluir funcionários.",
        variant: "destructive",
      })
      return
    }

    try {
      const { error } = await supabase.from("funcionarios").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Funcionário excluído",
        description: `O funcionário "${nome}" foi excluído com sucesso.`,
      })

      loadFuncionarios()
    } catch (error) {
      console.error("Erro ao excluir funcionário:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao excluir o funcionário.",
        variant: "destructive",
      })
    }
  }

  const filteredFuncionarios = funcionarios.filter(
    (funcionario) =>
      funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) || funcionario.telefone.includes(searchTerm),
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-sm md:text-base text-gray-600">
            {funcionarios.filter((f) => f.ativo).length} funcionários ativos
          </p>
        </div>
        {isSupervisor && (
          <Button onClick={onNavigateToCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Funcionário
          </Button>
        )}
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardContent className="p-3 md:p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar funcionários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {filteredFuncionarios.length > 0 ? (
          filteredFuncionarios.map((funcionario) => (
            <Card key={funcionario.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{funcionario.nome}</h3>
                    <p className="text-xs text-gray-600">{funcionario.telefone}</p>
                    <Badge
                      variant={funcionario.tipo === "supervisor" ? "default" : "secondary"}
                      className="text-xs mt-1"
                    >
                      {funcionario.tipo === "supervisor" ? "Supervisor" : "Funcionário"}
                    </Badge>
                  </div>
                  <Badge variant={funcionario.ativo ? "default" : "secondary"}>
                    {funcionario.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                {isSupervisor && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => onNavigateToEdit(funcionario.id)}
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(funcionario.id, funcionario.ativo)}
                    >
                      {funcionario.ativo ? "Desativar" : "Ativar"}
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
                            Tem certeza que deseja excluir o funcionário "{funcionario.nome}"? Esta ação não pode ser
                            desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(funcionario.id, funcionario.nome)}
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
          <Card>
            <CardContent className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum funcionário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {isSupervisor ? "Adicione um novo funcionário para começar." : "Nenhum funcionário cadastrado."}
              </p>
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
              <TableHead>Telefone</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-center">Status</TableHead>
              {isSupervisor && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFuncionarios.length > 0 ? (
              filteredFuncionarios.map((funcionario) => (
                <TableRow key={funcionario.id}>
                  <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  <TableCell>{funcionario.telefone}</TableCell>
                  <TableCell>
                    <Badge variant={funcionario.tipo === "supervisor" ? "default" : "secondary"}>
                      {funcionario.tipo === "supervisor" ? "Supervisor" : "Funcionário"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {isSupervisor ? (
                      <div className="flex justify-center">
                        <Switch
                          checked={funcionario.ativo}
                          onCheckedChange={() => handleToggleStatus(funcionario.id, funcionario.ativo)}
                        />
                      </div>
                    ) : (
                      <Badge variant={funcionario.ativo ? "default" : "secondary"}>
                        {funcionario.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    )}
                  </TableCell>
                  {isSupervisor && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onNavigateToEdit(funcionario.id)}
                        >
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
                                Tem certeza que deseja excluir o funcionário "{funcionario.nome}"? Esta ação não pode
                                ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(funcionario.id, funcionario.nome)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isSupervisor ? 5 : 4} className="text-center py-8">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum funcionário encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {isSupervisor ? "Adicione um novo funcionário para começar." : "Nenhum funcionário cadastrado."}
                  </p>
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
