"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { supabase, type Prateleira } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface PrateleiraFormProps {
  prateleiraId?: string
  onBack: () => void
  onSave: () => void
}

export function PrateleiraForm({ prateleiraId, onBack, onSave }: PrateleiraFormProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [prateleira, setPrateleira] = useState<Partial<Prateleira>>({
    numero: "",
    descricao: "",
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
      const { data, error } = await supabase.from("prateleiras").select("*").eq("id", prateleiraId).single()

      if (error) throw error

      setPrateleira(data)
    } catch (error) {
      console.error("Erro ao carregar prateleira:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da prateleira.",
        variant: "destructive",
      })
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setPrateleira({
      ...prateleira,
      [name]: value,
    })
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

      if (isEdit) {
        const { error } = await supabase.from("prateleiras").update(prateleira).eq("id", prateleiraId)

        if (error) throw error

        toast({
          title: "Prateleira atualizada",
          description: "A prateleira foi atualizada com sucesso.",
        })
      } else {
        const { error } = await supabase.from("prateleiras").insert([prateleira])

        if (error) throw error

        toast({
          title: "Prateleira cadastrada",
          description: "A prateleira foi cadastrada com sucesso.",
        })
      }

      onSave()
    } catch (error) {
      console.error("Erro ao salvar prateleira:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a prateleira.",
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
                  value={prateleira.numero || ""}
                  onChange={handleInputChange}
                  required
                  placeholder="Ex: Prat 01"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                value={prateleira.descricao || ""}
                onChange={handleInputChange}
                rows={4}
                placeholder="Descrição da prateleira..."
                disabled={loading}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
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
    </div>
  )
}
