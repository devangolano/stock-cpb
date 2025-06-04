"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase, type Funcionario } from "@/lib/supabase"

interface AuthContextType {
  user: Funcionario | null
  login: (telefone: string, senha: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Funcionario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado no localStorage
    const savedUser = localStorage.getItem("cpb-user")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  const login = async (telefone: string, senha: string): Promise<boolean> => {
    try {
      console.log("Tentando login com:", { telefone, senha }) // Debug

      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("telefone", telefone)
        .eq("senha", senha)
        .eq("ativo", true)
        .single()

      console.log("Resposta do Supabase:", { data, error }) // Debug

      if (error) {
        console.error("Erro do Supabase:", error)
        return false
      }

      if (!data) {
        console.log("Nenhum usuário encontrado")
        return false
      }

      console.log("Login bem-sucedido:", data)
      setUser(data)
      localStorage.setItem("cpb-user", JSON.stringify(data))
      return true
    } catch (error) {
      console.error("Erro na função login:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("cpb-user")
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
