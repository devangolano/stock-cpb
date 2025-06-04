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
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Erro ao carregar usuário salvo:", error)
        localStorage.removeItem("cpb-user")
      }
    }
    setLoading(false)
  }, [])

  const login = async (telefone: string, senha: string): Promise<boolean> => {
    try {
      console.log("Tentando login com:", { telefone, senha: "***" }) // Debug sem mostrar senha

      // Usar a função login_json_simples que criamos e que funciona
      const { data, error } = await supabase.rpc("login_json_simples", {
        p_telefone: telefone,
        p_senha: senha,
      })

      console.log("Resposta do Supabase RPC:", { data, error }) // Debug

      if (error) {
        console.error("Erro do Supabase:", error)
        return false
      }

      // A função retorna um JSON com success e user
      if (data && data.success && data.user) {
        const userData: Funcionario = {
          id: data.user.id,
          nome: data.user.nome,
          telefone: data.user.telefone,
          tipo: data.user.tipo,
          ativo: true,
          senha: "", // Não armazenar senha no frontend
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log("Login bem-sucedido:", userData)
        setUser(userData)
        localStorage.setItem("cpb-user", JSON.stringify(userData))
        return true
      } else {
        console.log("Login falhou:", data?.message || "Credenciais inválidas")
        return false
      }
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
