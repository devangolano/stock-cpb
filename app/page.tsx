"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Login } from "@/components/login"
import { Sidebar } from "@/components/layout/sidebar"
import { Dashboard } from "@/components/pages/dashboard"
import { Prateleiras } from "@/components/pages/prateleiras"
import { PrateleiraForm } from "@/components/pages/prateleira-form"
import { Produtos } from "@/components/pages/produtos"
import { ProdutoDetalhes } from "@/components/pages/produto-detalhes"
import { Categorias } from "@/components/pages/categorias"
import { Funcionarios } from "@/components/pages/funcionarios"
import { FuncionarioForm } from "@/components/pages/funcionario-form"
import { Movimentacoes } from "@/components/pages/movimentacoes"
import { ProdutoForm } from "@/components/pages/produto-form"
import { MovimentacaoForm } from "@/components/pages/movimentacao-form"
import { MovimentacaoDetalhes } from "@/components/pages/movimentacao-detalhes"
import { Financeiro } from "@/components/pages/financeiro"
import { validateUUID, validatePageName } from "@/lib/validators"

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" suppressHydrationWarning></div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  // Estados para IDs validados
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedPrateleiraId, setSelectedPrateleiraId] = useState<string | null>(null)
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string | null>(null)
  const [selectedMovimentacaoId, setSelectedMovimentacaoId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Extrair e validar dados da URL
  useEffect(() => {
    if (mounted) {
      // ✅ Validar todos os IDs antes de usar
      const productId = validateUUID(searchParams.get("productId"))
      const prateleiraId = validateUUID(searchParams.get("prateleiraId"))
      const funcionarioId = validateUUID(searchParams.get("funcionarioId"))
      const movimentacaoId = validateUUID(searchParams.get("movimentacaoId"))

      setSelectedProductId(productId)
      setSelectedPrateleiraId(prateleiraId)
      setSelectedFuncionarioId(funcionarioId)
      setSelectedMovimentacaoId(movimentacaoId)
    }
  }, [searchParams, mounted])

  if (!mounted || loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Login />
  }

  // Função para navegar com parâmetros validados
  const navigateTo = (page: string, params?: Record<string, string>) => {
    // ✅ Validar nome da página
    const validPage = validatePageName(page)

    const url = new URL(window.location.href)
    url.searchParams.set("page", validPage)

    // Limpar parâmetros antigos
    url.searchParams.delete("productId")
    url.searchParams.delete("prateleiraId")
    url.searchParams.delete("funcionarioId")
    url.searchParams.delete("movimentacaoId")

    // ✅ Validar e adicionar novos parâmetros
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        // Validar IDs antes de adicionar à URL
        if (key.endsWith("Id")) {
          const validId = validateUUID(value)
          if (validId) {
            url.searchParams.set(key, validId)
          }
        } else {
          // Para outros parâmetros, sanitizar
          url.searchParams.set(key, value.trim().substring(0, 100))
        }
      })
    }

    router.push(url.pathname + url.search)
  }

  // Handlers de navegação (mantidos iguais)
  const handleNavigateToProduct = (productId: string) => {
    navigateTo("produto-detalhes", { productId })
  }

  const handleNavigateToCreateProduto = () => {
    navigateTo("produto-form")
  }

  const handleNavigateToEditProduto = (productId: string) => {
    navigateTo("produto-form", { productId })
  }

  const handleNavigateToViewProduto = (productId: string) => {
    navigateTo("produto-detalhes", { productId })
  }

  const handleNavigateToCreatePrateleira = () => {
    navigateTo("prateleira-form")
  }

  const handleNavigateToEditPrateleira = (prateleiraId: string) => {
    navigateTo("prateleira-form", { prateleiraId })
  }

  const handleNavigateToCreateFuncionario = () => {
    navigateTo("funcionario-form")
  }

  const handleNavigateToEditFuncionario = (funcionarioId: string) => {
    navigateTo("funcionario-form", { funcionarioId })
  }

  const handleNavigateToCreateMovimentacao = () => {
    navigateTo("movimentacao-form")
  }

  const handleNavigateToViewMovimentacao = (movimentacaoId: string) => {
    navigateTo("movimentacao-detalhes", { movimentacaoId })
  }

  // Handlers de volta
  const handleBackToDashboard = () => navigateTo("dashboard")
  const handleBackToProdutos = () => navigateTo("produtos")
  const handleBackToPrateleiras = () => navigateTo("prateleiras")
  const handleBackToFuncionarios = () => navigateTo("funcionarios")
  const handleBackToMovimentacoes = () => navigateTo("movimentacoes")

  // Handlers de save
  const handleSaveProduto = () => navigateTo("produtos")
  const handleSavePrateleira = () => navigateTo("prateleiras")
  const handleSaveFuncionario = () => navigateTo("funcionarios")
  const handleSaveMovimentacao = () => navigateTo("movimentacoes")

  // ✅ Validar página atual
  const currentPage = validatePageName(searchParams.get("page"))

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return (
          <Dashboard
            onNavigateToProduct={handleNavigateToProduct}
            onNavigateToCreate={handleNavigateToCreateProduto}
            onNavigateToEdit={handleNavigateToEditProduto}
            onNavigateToView={handleNavigateToViewProduto}
          />
        )

      case "produtos":
        return (
          <Produtos
            onNavigateToCreate={handleNavigateToCreateProduto}
            onNavigateToEdit={handleNavigateToEditProduto}
            onNavigateToView={handleNavigateToViewProduto}
          />
        )

      case "produto-form":
        return (
          <ProdutoForm
            produtoId={selectedProductId || undefined}
            onBack={handleBackToProdutos}
            onSave={handleSaveProduto}
          />
        )

      case "produto-detalhes":
        return selectedProductId ? (
          <ProdutoDetalhes productId={selectedProductId} onBack={handleBackToDashboard} />
        ) : (
          <Dashboard
            onNavigateToProduct={handleNavigateToProduct}
            onNavigateToCreate={handleNavigateToCreateProduto}
            onNavigateToEdit={handleNavigateToEditProduto}
            onNavigateToView={handleNavigateToViewProduto}
          />
        )

      case "prateleiras":
        return <Prateleiras />

      case "prateleira-form":
        return (
          <PrateleiraForm
            prateleiraId={selectedPrateleiraId || undefined}
            onBack={handleBackToPrateleiras}
            onSave={handleSavePrateleira}
          />
        )

      case "categorias":
        return <Categorias />

      case "funcionarios":
        return (
          <Funcionarios
            onNavigateToCreate={handleNavigateToCreateFuncionario}
            onNavigateToEdit={handleNavigateToEditFuncionario}
          />
        )

      case "funcionario-form":
        return (
          <FuncionarioForm
            funcionarioId={selectedFuncionarioId || undefined}
            onBack={handleBackToFuncionarios}
            onSave={handleSaveFuncionario}
          />
        )

      case "movimentacoes":
        return (
          <Movimentacoes
            onNavigateToCreate={handleNavigateToCreateMovimentacao}
            onNavigateToView={handleNavigateToViewMovimentacao}
          />
        )

      case "movimentacao-form":
        return <MovimentacaoForm onBack={handleBackToMovimentacoes} onSave={handleSaveMovimentacao} />

      case "movimentacao-detalhes":
        return selectedMovimentacaoId ? (
          <MovimentacaoDetalhes movimentacaoId={selectedMovimentacaoId} onBack={handleBackToMovimentacoes} />
        ) : (
          <Movimentacoes
            onNavigateToCreate={handleNavigateToCreateMovimentacao}
            onNavigateToView={handleNavigateToViewMovimentacao}
          />
        )

      case "financeiro":
        return <Financeiro />

      default:
        return (
          <Dashboard
            onNavigateToProduct={handleNavigateToProduct}
            onNavigateToCreate={handleNavigateToCreateProduto}
            onNavigateToEdit={handleNavigateToEditProduto}
            onNavigateToView={handleNavigateToViewProduto}
          />
        )
    }
  }

  return (
    <div className="flex h-screen bg-gray-50" suppressHydrationWarning>
      <Sidebar currentPage={currentPage} onPageChange={(page) => navigateTo(page)} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div>
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  return <AppContent />
}
