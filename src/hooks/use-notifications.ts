"use client"

import { useState, useEffect } from "react"
import { notificationService, type Notification } from "../lib/notifications"

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications)
    return unsubscribe
  }, [])

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    notificationService.addNotification(notification)
  }

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id)
  }

  const markAllAsRead = () => {
    notificationService.markAllAsRead()
  }

  const clearNotification = (id: string) => {
    notificationService.clearNotification(id)
  }

  const clearAll = () => {
    notificationService.clearAll()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  }
}
