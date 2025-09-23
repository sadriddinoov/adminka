"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Switch } from "../../components/ui/switch"
import { Separator } from "../../components/ui/separator"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Settings, User, Bell, Globe, Palette, Database, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNotifications } from "@/hooks/use-notifications"

export default function SettingsPage() {
  const { user } = useAuth()
  const { clearAll } = useNotifications()
  const [language, setLanguage] = useState("ru")
  const [theme, setTheme] = useState("dark")
  const [notifications, setNotifications] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("30")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    // In a real app, this would save to backend
    localStorage.setItem(
      "settings",
      JSON.stringify({
        language,
        theme,
        notifications,
        autoRefresh,
        refreshInterval,
      }),
    )

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearNotifications = () => {
    clearAll()
  }

  return (
    <AppLayout title="Настройки" subtitle="Конфигурация системы и пользовательские предпочтения">
      <div className="max-w-4xl space-y-6">
        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Профиль пользователя
            </CardTitle>
            <CardDescription>Информация о текущем пользователе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Имя пользователя</Label>
                <Input value={user?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input value={user?.name || ""} disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <div>
                <Badge variant="secondary">{user?.role || "administrator"}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interface Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Интерфейс
            </CardTitle>
            <CardDescription>Настройки внешнего вида и языка</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Язык интерфейса</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="uz">O'zbek</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Тема оформления</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Темная</SelectItem>
                    <SelectItem value="light">Светлая</SelectItem>
                    <SelectItem value="system">Системная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Уведомления
            </CardTitle>
            <CardDescription>Управление уведомлениями системы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Включить уведомления</Label>
                <p className="text-sm text-muted-foreground">Получать уведомления о трансферах и системных событиях</p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Очистить все уведомления</Label>
                <p className="text-sm text-muted-foreground">Удалить все существующие уведомления</p>
              </div>
              <Button variant="outline" onClick={handleClearNotifications}>
                Очистить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Система
            </CardTitle>
            <CardDescription>Настройки работы системы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автообновление данных</Label>
                <p className="text-sm text-muted-foreground">Автоматически обновлять данные на страницах</p>
              </div>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>

            {autoRefresh && (
              <div className="space-y-2">
                <Label>Интервал обновления (секунды)</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 секунд</SelectItem>
                    <SelectItem value="30">30 секунд</SelectItem>
                    <SelectItem value="60">1 минута</SelectItem>
                    <SelectItem value="300">5 минут</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          {saved && (
            <Alert className="w-auto border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>Настройки сохранены</AlertDescription>
            </Alert>
          )}
          <Button onClick={handleSave}>
            <Settings className="mr-2 h-4 w-4" />
            Сохранить настройки
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
