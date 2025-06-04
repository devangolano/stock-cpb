"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { prateleirasService } from "@/lib/database"
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

      const data = await prateleirasService.getById(prateleiraId)

      if (!data) {
        throw new Error("Prateleira não encontrada")
      }

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

  const validateForm = (): string | null => {
    if (!prateleira.numero.trim()) {
      return "O número da prateleira é obrigatório"
    }

    if (prateleira.numero.length < 2) {
      return "O número da prateleira deve ter pelo menos 2 caracteres"
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

    // Validar formulário
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (isEdit && prateleiraId) {
        await prateleirasService.update(prateleiraId, prateleira)
        toast({
          title: "Prateleira atualizada",
          description: "A prateleira foi atualizada com sucesso.",
        })
      } else {
        await prateleirasService.create(prateleira)
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
                <p className="text-xs text-gray-500">Identificação única da prateleira (mínimo 2 caracteres)</p>
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

      {/* Informações de ajuda */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dicas para cadastro de prateleiras:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use códigos simples e organizados (ex: A01, A02, B01, B02)</li>
            <li>• Mantenha um padrão de nomenclatura consistente</li>
            <li>• A descrição pode incluir localização física ou tipo de produtos</li>
            <li>• Prateleiras inativas ficam ocultas mas mantêm o histórico</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
