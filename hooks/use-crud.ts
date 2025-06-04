"use client"

import { useState, useEffect } from "react"

interface UseCrudOptions<T> {
  service: {
    getAll: () => Promise<T[]>
    getById: (id: string) => Promise<T | null>
    create: (data: any) => Promise<T>
    update: (id: string, data: any) => Promise<T>
    delete: (id: string) => Promise<void>
    toggleActive?: (id: string, ativo: boolean) => Promise<void>
  }
  initialLoad?: boolean
}

export function useCrud<T extends { id: string }>({ service, initialLoad = true }: UseCrudOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Carregar todos os itens
  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.getAll()
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  // Criar novo item
  const createItem = async (data: any): Promise<T | null> => {
    setError(null)
    try {
      const newItem = await service.create(data)
      setItems((prev) => [newItem, ...prev])
      return newItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar item")
      return null
    }
  }

  // Atualizar item
  const updateItem = async (id: string, data: any): Promise<T | null> => {
    setError(null)
    try {
      const updatedItem = await service.update(id, data)
      setItems((prev) => prev.map((item) => (item.id === id ? updatedItem : item)))
      return updatedItem
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar item")
      return null
    }
  }

  // Deletar item
  const deleteItem = async (id: string): Promise<boolean> => {
    setError(null)
    try {
      await service.delete(id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar item")
      return false
    }
  }

  // Ativar/Desativar item
  const toggleActive = async (id: string, ativo: boolean): Promise<boolean> => {
    if (!service.toggleActive) return false

    setError(null)
    try {
      await service.toggleActive(id, ativo)
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ativo } : item)))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status")
      return false
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    if (initialLoad) {
      loadItems()
    }
  }, [initialLoad])

  return {
    items,
    loading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    toggleActive,
    setError,
  }
}
