"use client"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  title: string
  message: string
  timestamp: string
  read: boolean
}

class NotificationService {
  private listeners: ((notifications: Notification[]) => void)[] = []
  private notifications: Notification[] = []

  constructor() {
    if (typeof window !== "undefined") {
      this.loadNotifications()
    }
  }

  private loadNotifications() {
    const stored = localStorage.getItem("notifications")
    if (stored) {
      try {
        this.notifications = JSON.parse(stored)
      } catch {
        this.notifications = []
      }
    }
  }

  private saveNotifications() {
    localStorage.setItem("notifications", JSON.stringify(this.notifications))
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.notifications))
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    listener(this.notifications) // Send current state immediately
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  addNotification(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    }

    this.notifications.unshift(newNotification)

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50)
    }

    this.saveNotifications()
    this.notifyListeners()
  }

  markAsRead(id: string) {
    const notification = this.notifications.find((n) => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
      this.notifyListeners()
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true))
    this.saveNotifications()
    this.notifyListeners()
  }

  clearNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id)
    this.saveNotifications()
    this.notifyListeners()
  }

  clearAll() {
    this.notifications = []
    this.saveNotifications()
    this.notifyListeners()
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length
  }

  getNotifications(): Notification[] {
    return this.notifications
  }
}

export const notificationService = new NotificationService()
