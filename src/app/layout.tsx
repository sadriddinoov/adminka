import type React from "react"
import "./globals.css"


export const metadata = {
  title: "Склад Админ - Панель управления",
  description: "Система управления складскими операциями и трансферами",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  )
}
