"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Funcionario } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface FuncionarioFormProps {
  funcionarioId?: string
  onBack: () => void
  onSave: () => void
}

export function FuncionarioForm({ funcionarioId, onBack, onSave }: FuncionarioFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [funcionario, setFuncionario] = useState<Partial<Funcionario>>({
    nome: "",
    telefone: "",
    senha: "",
    tipo: "funcionario",
    ativo: true,
  })

  const isEdit = !!funcionarioId
  const isSupervisor = user?.tipo === "supervisor"

  useEffect(() => {
    if (funcionarioId) {
      loadFuncionario()
    }
  }, [funcionarioId])

  const loadFuncionario = async () => {
    if (!funcionarioId) return

    try {
      setLoading(true)
      const { data, error } = await supabase.from("funcionarios").select("*").eq("id", funcionarioId).single()

      if (error) throw error

      setFuncionario({
        nome: data.nome,
        telefone: data.telefone,
        senha: "", // Não preenche a senha por segurança
        tipo: data.tipo,
        ativo: data.ativo,
      })
    } catch (error) {
      console.error("Erro ao carregar funcionário:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do funcionário.",
        variant: "destructive",
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFuncionario({
      ...funcionario,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFuncionario({
      ...funcionario,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupervisor) {
      toast({
        title: "Acesso negado",
        description: "Apenas supervisores podem criar/editar funcionários.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      if (isEdit) {
        // Se estiver editando e a senha estiver vazia, não atualiza a senha
        const updateData = { ...funcionario }
        if (!updateData.senha) {
          delete updateData.senha
        }

        const { error } = await supabase.from("funcionarios").update(updateData).eq("id", funcionarioId)

        if (error) throw error

        toast({
          title: "Funcionário atualizado",
          description: "O funcionário foi atualizado com sucesso.",
        })
      } else {
        const { error } = await supabase.from("funcionarios").insert([funcionario])

        if (error) throw error

        toast({
          title: "Funcionário cadastrado",
          description: "O funcionário foi cadastrado com sucesso.",
        })
      }

      onSave()
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar o funcionário.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isSupervisor) {
    return (
      <div className="p-6">
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="text-center py-8">
            <h3 className="text-lg font-medium text-red-900 mb-2">Acesso Negado</h3>
            <p className="text-sm text-red-700">Apenas supervisores podem criar/editar funcionários.</p>
          </CardContent>
        </Card>
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
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          {isEdit ? "Editar Funcionário" : "Novo Funcionário"}
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          {isEdit ? "Edite os dados do funcionário" : "Preencha os dados para cadastrar um novo funcionário"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Funcionário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome*</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={funcionario.nome || ""}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone*</Label>
                <Input
                  id="telefone"
                  name="telefone"
                  type="tel"
                  value={funcionario.telefone || ""}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo*</Label>
                <Select
                  value={funcionario.tipo || "funcionario"}
                  onValueChange={(value) => handleSelectChange("tipo", value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">{isEdit ? "Nova Senha (deixe em branco para manter a atual)" : "Senha*"}</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    name="senha"
                    type={showPassword ? "text" : "password"}
                    value={funcionario.senha || ""}
                    onChange={handleInputChange}
                    required={!isEdit}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                name="ativo"
                checked={funcionario.ativo}
                onCheckedChange={(checked) => setFuncionario({ ...funcionario, ativo: checked })}
                disabled={loading}
              />
              <Label htmlFor="ativo">Funcionário ativo</Label>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar Funcionário"}
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
