import { AppLayout } from "../components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Switch } from "../components/ui/switch"
import { Separator } from "../components/ui/separator"
import { Badge } from "../components/ui/badge"
import { Settings, User, Bell, Shield, Database } from "lucide-react"

export function SettingsPage() {
  return (
    <AppLayout title="Настройки" subtitle="Конфигурация системы и пользователя">
      <div className="space-y-6">
        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Профиль пользователя
            </CardTitle>
            <CardDescription>Управление информацией о пользователе и настройками аккаунта</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Имя пользователя</Label>
                <Input id="username" defaultValue="admin" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Полное имя</Label>
                <Input id="name" defaultValue="Администратор" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Роль</Label>
              <div className="flex items-center gap-2">
                <Input id="role" defaultValue="administrator" disabled />
                <Badge variant="secondary">Администратор</Badge>
              </div>
            </div>
            <Button>Сохранить изменения</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Уведомления
            </CardTitle>
            <CardDescription>Настройка уведомлений о трансферах и системных событиях</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления о трансферах</Label>
                <p className="text-sm text-muted-foreground">
                  Получать уведомления при создании и завершении трансферов
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Системные уведомления</Label>
                <p className="text-sm text-muted-foreground">Уведомления об ошибках и системных событиях</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email уведомления</Label>
                <p className="text-sm text-muted-foreground">Отправлять дублирующие уведомления на email</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Системные настройки
            </CardTitle>
            <CardDescription>Общие настройки системы управления складом</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="language">Язык интерфейса</Label>
                <Input id="language" defaultValue="Русский" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Часовой пояс</Label>
                <Input id="timezone" defaultValue="UTC+5 (Ташкент)" disabled />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Темная тема</Label>
                <p className="text-sm text-muted-foreground">Использовать темную тему интерфейса</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
            <CardDescription>Настройки безопасности и доступа к системе</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Текущий пароль</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Новый пароль</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Подтвердить пароль</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button variant="outline">Изменить пароль</Button>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              База данных
            </CardTitle>
            <CardDescription>Информация о подключении к базе данных и статистика</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус подключения</Label>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Подключено (Mock API)</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Последняя синхронизация</Label>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleString("ru-RU")}</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Статистика данных</Label>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium">Локации: 4</p>
                </div>
                <div>
                  <p className="font-medium">Товары: 7</p>
                </div>
                <div>
                  <p className="font-medium">Трансферы: 3</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
