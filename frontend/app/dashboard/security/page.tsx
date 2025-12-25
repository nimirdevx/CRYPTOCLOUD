"use client"

import { Suspense } from "react"
import SecurityContent from "./security-content"

export default function SecurityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 border-4 border-[#7c5cff] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <SecurityContent />
    </Suspense>
  )
}
