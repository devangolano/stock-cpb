"use client"
import { Suspense } from "react"
import { AppContent } from "@/components/app-content"

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" suppressHydrationWarning></div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppContent />
    </Suspense>
  )
}
