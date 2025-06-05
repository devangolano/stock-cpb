// Validadores para parâmetros de URL e entrada de dados

export const validateUUID = (id: string | null): string | null => {
  if (!id) return null

  // Regex para UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  return uuidRegex.test(id) ? id : null
}

export const validatePageName = (page: string | null): string => {
  const validPages = [
    "dashboard",
    "produtos",
    "produto-form",
    "produto-detalhes",
    "prateleiras",
    "prateleira-form",
    "categorias",
    "funcionarios",
    "funcionario-form",
    "movimentacoes",
    "movimentacao-form",
    "movimentacao-detalhes",
    "financeiro",
  ]

  return validPages.includes(page || "") ? page! : "dashboard"
}

export const sanitizeSearchTerm = (term: string): string => {
  // Remove caracteres especiais perigosos
  return term
    .replace(/[<>'"]/g, "") // Remove HTML/SQL chars
    .trim()
    .substring(0, 100) // Limita tamanho
}

export const validateProductCode = (code: string): boolean => {
  // Valida formato: 3 letras + 2 números
  const codeRegex = /^[A-Za-z]{3}[0-9]{2}$/
  return codeRegex.test(code)
}

export const validateNumericInput = (value: any): number => {
  const num = Number(value)
  return isNaN(num) || num < 0 ? 0 : num
}
