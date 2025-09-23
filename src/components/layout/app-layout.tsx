"use client"

import type React from "react"

import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { AuthGuard } from "@/components/auth/auth-guard"

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <div className="md:ml-64">
          <Header title={title} subtitle={subtitle} />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
