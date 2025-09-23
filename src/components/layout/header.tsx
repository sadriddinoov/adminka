"use client"

import { NotificationDropdown } from "@/components/notifications/notification-dropdown"

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <NotificationDropdown />
        </div>
      </div>
    </header>
  )
}
