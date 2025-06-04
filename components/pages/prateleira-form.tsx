"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { PrateleiraInput } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, AlertCircle } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"

interface PrateleiraFormProps {
  prateleiraId?: string
  onBack: () => void
  onSave: () => void
}

export function PrateleiraForm({ prateleiraId, onBack, onSave }: PrateleiraFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [originalNumero, setOriginalNumero] = useState<string>("")
  const [prateleira, setPrateleira] = useState<PrateleiraInput>({
    numero: "",
    descricao: "",
    ativo: true,
  })

  const isEdit = !!prateleiraId
  const isSupervisor = user?.tipo === "supervisor"

  useEffect(() => {
    if (prateleiraId) {
      loadPrateleira()
    }
  }, [prateleiraId])

  const loadPrateleira = async () => {
    if (!prateleiraId) return

    try {
      setLoading(true)
      setError(null)

      console.log("Carregando prateleira com ID:", prateleiraId)

      // Usar consulta direta ao Supabase para evitar problemas de RLS
      const { data, error } = await supabase.from("prateleiras").select("*").eq("id", prateleiraId).single()

      if (error) {
        console.error("Erro do Supabase:", error)
        throw new Error(`Erro ao buscar prateleira: ${error.message}`)
      }

      if (!data) {
        throw new Error("Prateleira não encontrada")
      }

      console.log("Prateleira carregada:", data)

      // Salvar o número original para verificação de duplicatas
      setOriginalNumero(data.numero)

      setPrateleira({
        numero: data.numero,
        descricao: data.descricao || "",
        ativo: data.ativo,
      })
    } catch (error) {
      console.error("Erro ao carregar prateleira:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao carregar prateleira"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da prateleira.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPrateleira((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError(null) // Limpar erro ao digitar
  }

  const handleSwitchChange = (checked: boolean) => {
    setPrateleira((prev) => ({
      ...prev,
      ativo: checked,
    }))
  }

  const checkDuplicateNumero = async (numero: string): Promise<boolean> => {
    try {
      // Se estamos editando e o número não mudou, não é duplicata
      if (isEdit && numero === originalNumero) {
        return false
      }

      const { data, error } = await supabase.from("prateleiras").select("id").eq("numero", numero.trim()).limit(1)

      if (error) {
        console.error("Erro ao verificar duplicata:", error)
        return false // Em caso de erro, permitir continuar
      }

      return data && data.length > 0
    } catch (error) {
      console.error("Erro na verificação de duplicata:", error)
      return false
    }
  }

  const validateForm = async (): Promise<string | null> => {
    if (!prateleira.numero.trim()) {
      return "O número da prateleira é obrigatório"
    }

    if (prateleira.numero.length < 2) {
      return "O número da prateleira deve ter pelo menos 2 caracteres"
    }

    // Verificar duplicatas
    const isDuplicate = await checkDuplicateNumero(prateleira.numero)
    if (isDuplicate) {
      return `Já existe uma prateleira com o número "${prateleira.numero}". Escolha um número diferente.`
    }

    return null
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
      setLoading(true)
      setError(null)

      // Validar formulário (incluindo verificação de duplicatas)
      const validationError = await validateForm()
      if (validationError) {
        setError(validationError)
        return
      }

      console.log("Salvando prateleira:", { isEdit, prateleiraId, prateleira, originalNumero })

      if (isEdit && prateleiraId) {
        // Atualizar prateleira existente
        const { error } = await supabase
          .from("prateleiras")
          .update({
            numero: prateleira.numero.trim(),
            descricao: prateleira.descricao?.trim() || null,
            ativo: prateleira.ativo,
            updated_at: new Date().toISOString(),
          })
          .eq("id", prateleiraId)

        if (error) {
          console.error("Erro ao atualizar:", error)

          // Tratar erro específico de duplicata
          if (error.code === "23505") {
            throw new Error(
              `Já existe uma prateleira com o número "${prateleira.numero}". Escolha um número diferente.`,
            )
          }

          throw new Error(`Erro ao atualizar prateleira: ${error.message}`)
        }

        toast({
          title: "Prateleira atualizada",
          description: "A prateleira foi atualizada com sucesso.",
        })
      } else {
        // Criar nova prateleira
        const { error } = await supabase.from("prateleiras").insert([
          {
            numero: prateleira.numero.trim(),
            descricao: prateleira.descricao?.trim() || null,
            ativo: prateleira.ativo,
          },
        ])

        if (error) {
          console.error("Erro ao criar:", error)

          // Tratar erro específico de duplicata
          if (error.code === "23505") {
            throw new Error(
              `Já existe uma prateleira com o número "${prateleira.numero}". Escolha um número diferente.`,
            )
          }

          throw new Error(`Erro ao criar prateleira: ${error.message}`)
        }

        toast({
          title: "Prateleira cadastrada",
          description: "A prateleira foi cadastrada com sucesso.",
        })
      }

      onSave()
    } catch (error) {
      console.error("Erro ao salvar prateleira:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro ao salvar prateleira"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
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
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Acesso Negado</h3>
            <p className="text-sm text-red-700">Apenas supervisores podem criar/editar prateleiras.</p>
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
          {isEdit ? "Editar Prateleira" : "Nova Prateleira"}
        </h1>
        <p className="text-sm md:text-base text-gray-600">
          {isEdit ? "Edite os dados da prateleira" : "Preencha os dados para cadastrar uma nova prateleira"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Prateleira</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numero">Número da Prateleira*</Label>
                <Input
                  id="numero"
                  name="numero"
                  value={prateleira.numero}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: A01, B02, Prat-01"
                  disabled={loading}
                  className={error && !prateleira.numero.trim() ? "border-red-500" : ""}
                />
                <p className="text-xs text-gray-500">
                  Identificação única da prateleira (mínimo 2 caracteres)
                  {isEdit && originalNumero && (
                    <span className="block text-blue-600">Número atual: {originalNumero}</span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ativo">Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={prateleira.ativo}
                    onCheckedChange={handleSwitchChange}
                    disabled={loading}
                  />
                  <Label htmlFor="ativo" className="text-sm">
                    {prateleira.ativo ? "Ativa" : "Inativa"}
                  </Label>
                </div>
                <p className="text-xs text-gray-500">Prateleiras inativas não aparecem nas listagens</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={prateleira.descricao}
                onChange={handleInputChange}
                rows={4}
                placeholder="Descrição da localização ou características da prateleira..."
                disabled={loading}
              />
              <p className="text-xs text-gray-500">Informações adicionais sobre a prateleira (opcional)</p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !prateleira.numero.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Cadastrar Prateleira"}
              </Button>
              <Button type="button" variant="outline" onClick={onBack} disabled={loading}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Debug info (remover em produção) */}
      {process.env.NODE_ENV === "development" && (
        <Card className="mt-6 bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <h4 className="font-medium text-gray-900 mb-2">🔧 Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                Usuário: {user?.nome} ({user?.tipo})
              </div>
              <div>Prateleira ID: {prateleiraId || "Nova"}</div>
              <div>É Edição: {isEdit ? "Sim" : "Não"}</div>
              <div>Número Original: {originalNumero || "N/A"}</div>
              <div>Número Atual: {prateleira.numero}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
