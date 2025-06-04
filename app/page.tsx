"use client"

import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
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

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" suppressHydrationWarning></div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedPrateleiraId, setSelectedPrateleiraId] = useState<string | null>(null)
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState<string | null>(null)
  const [selectedMovimentacaoId, setSelectedMovimentacaoId] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Não renderizar até que o componente esteja montado
  if (!mounted) {
    return <LoadingSpinner />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Login />
  }

  const handleNavigateToProduct = (productId: string) => {
    setSelectedProductId(productId)
    setCurrentPage("produto-detalhes")
  }

  const handleBackFromProduct = () => {
    setSelectedProductId(null)
    setCurrentPage("dashboard")
  }

  const handleNavigateToCreatePrateleira = () => {
    setSelectedPrateleiraId(null)
    setCurrentPage("prateleira-form")
  }

  const handleNavigateToEditPrateleira = (prateleiraId: string) => {
    setSelectedPrateleiraId(prateleiraId)
    setCurrentPage("prateleira-form")
  }

  const handleBackFromPrateleira = () => {
    setSelectedPrateleiraId(null)
    setCurrentPage("dashboard")
  }

  const handleSavePrateleira = () => {
    setSelectedPrateleiraId(null)
    setCurrentPage("dashboard")
  }

  const handleNavigateToCreateFuncionario = () => {
    setSelectedFuncionarioId(null)
    setCurrentPage("funcionario-form")
  }

  const handleNavigateToEditFuncionario = (funcionarioId: string) => {
    setSelectedFuncionarioId(funcionarioId)
    setCurrentPage("funcionario-form")
  }

  const handleBackFromFuncionario = () => {
    setSelectedFuncionarioId(null)
    setCurrentPage("funcionarios")
  }

  const handleSaveFuncionario = () => {
    setSelectedFuncionarioId(null)
    setCurrentPage("funcionarios")
  }

  const handleNavigateToCreateProduto = () => {
    setSelectedProductId(null)
    setCurrentPage("produto-form")
  }

  const handleNavigateToEditProduto = (productId: string) => {
    setSelectedProductId(productId)
    setCurrentPage("produto-form")
  }

  const handleNavigateToViewProduto = (productId: string) => {
    setSelectedProductId(productId)
    setCurrentPage("produto-detalhes")
  }

  const handleBackFromProdutoForm = () => {
    setSelectedProductId(null)
    setCurrentPage("produtos")
  }

  const handleSaveProduto = () => {
    setSelectedProductId(null)
    setCurrentPage("produtos")
  }

  const handleNavigateToCreateMovimentacao = () => {
    setCurrentPage("movimentacao-form")
  }

  const handleNavigateToViewMovimentacao = (movimentacaoId: string) => {
    setSelectedMovimentacaoId(movimentacaoId)
    setCurrentPage("movimentacao-detalhes")
  }

  const handleBackFromMovimentacao = () => {
    setSelectedMovimentacaoId(null)
    setCurrentPage("movimentacoes")
  }

  const handleSaveMovimentacao = () => {
    setCurrentPage("movimentacoes")
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigateToProduct={handleNavigateToProduct} />
      case "prateleiras":
        return <Prateleiras />
      case "prateleira-form":
        return (
          <PrateleiraForm
            prateleiraId={selectedPrateleiraId || undefined}
            onBack={handleBackFromPrateleira}
            onSave={handleSavePrateleira}
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
      case "produto-detalhes":
        return selectedProductId ? (
          <ProdutoDetalhes productId={selectedProductId} onBack={handleBackFromProduct} />
        ) : (
          <Dashboard onNavigateToProduct={handleNavigateToProduct} />
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
            onBack={handleBackFromFuncionario}
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
      case "produto-form":
        return (
          <ProdutoForm
            produtoId={selectedProductId || undefined}
            onBack={handleBackFromProdutoForm}
            onSave={handleSaveProduto}
          />
        )
      case "movimentacao-form":
        return <MovimentacaoForm onBack={handleBackFromMovimentacao} onSave={handleSaveMovimentacao} />
      case "movimentacao-detalhes":
        return selectedMovimentacaoId ? (
          <MovimentacaoDetalhes movimentacaoId={selectedMovimentacaoId} onBack={handleBackFromMovimentacao} />
        ) : (
          <Movimentacoes
            onNavigateToCreate={handleNavigateToCreateMovimentacao}
            onNavigateToView={handleNavigateToViewMovimentacao}
          />
        )
      case "financeiro":
        return <Financeiro />
      default:
        return <Dashboard onNavigateToProduct={handleNavigateToProduct} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50" suppressHydrationWarning>
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div>
        {renderPage()}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
