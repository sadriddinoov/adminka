"use client"

import { useState } from "react"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { ScrollArea } from "../../components/ui/scroll-area"
import { Separator } from "../../components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuHeader,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu"
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, X, Check } from "lucide-react"
import { useNotifications } from "@/hooks/use-notifications"
import { cn } from "@/lib/utils"

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Только что"
    if (diffInMinutes < 60) return `${diffInMinutes} мин назад`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} ч назад`
    return date.toLocaleDateString("ru-RU")
  }

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead(id)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuHeader className="flex items-center justify-between p-4">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-1" />
              Прочитать все
            </Button>
          )}
        </DropdownMenuHeader>
        <Separator />
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Нет уведомлений</p>
            </div>
          ) : (
            <div className="p-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors",
                    !notification.read && "bg-muted/30",
                  )}
                  onClick={() => handleNotificationClick(notification.id, notification.read)}
                >
                  <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={cn("text-sm font-medium", !notification.read && "font-semibold")}>
                        {notification.title}
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          clearNotification(notification.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatTime(notification.timestamp)}</p>
                  </div>
                  {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
