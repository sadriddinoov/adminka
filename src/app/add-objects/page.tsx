import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Textarea } from "../../components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Plus, Package, MapPin, CheckCircle, AlertCircle } from "lucide-react"
import { mockAPI, type Location, type Item } from "../../lib/mock-api"

export default function AddObjectsPage() {
  const [activeTab, setActiveTab] = useState("items")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Item form state
  const [itemForm, setItemForm] = useState({
    name: "",
    quantity: "",
    unit: "",
    locationId: "",
  })

  // Location form state
  const [locationForm, setLocationForm] = useState({
    name: "",
    address: "",
  })

  const [locations, setLocations] = useState<Location[]>([])

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await mockAPI.getLocations()
        setLocations(data)
      } catch (err) {
        console.error("Error loading locations:", err)
      }
    }
    loadLocations()
  }, [])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!itemForm.name || !itemForm.quantity || !itemForm.unit || !itemForm.locationId) {
        throw new Error("Все поля обязательны для заполнения")
      }

      const quantity = Number.parseInt(itemForm.quantity)
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error("Количество должно быть положительным числом")
      }

      const newItem: Item = {
        id: `item-${Date.now()}`,
        name: itemForm.name,
        quantity: quantity,
        unit: itemForm.unit,
      }

      setLocations((prev) =>
        prev.map((l) =>
          l.id === itemForm.locationId ? { ...l, items: [...l.items, newItem] } : l,
        ),
      )

      setSuccess(`Товар "${itemForm.name}" успешно добавлен`)
      setItemForm({ name: "", quantity: "", unit: "", locationId: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!locationForm.name || !locationForm.address) {
        throw new Error("Все поля обязательны для заполнения")
      }

      const newLocation: Location = {
        id: `location-${Date.now()}`,
        name: locationForm.name,
        address: locationForm.address,
        items: [],
      }

      setLocations((prev) => [...prev, newLocation])
      setSuccess(`Локация "${locationForm.name}" успешно добавлена`)
      setLocationForm({ name: "", address: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout title="Добавить объекты" subtitle="Добавление новых товаров и локаций в систему">
      <div className="max-w-4xl space-y-6">
        {/* Status Messages */}
        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="items" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Добавить товар
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Добавить локацию
            </TabsTrigger>
          </TabsList>

          {/* Add Item Tab */}
          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="mr-2 h-5 w-5" />
                  Добавить новый товар
                </CardTitle>
                <CardDescription>
                  Добавьте новый товар в выбранную складскую локацию
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="item-name">Название товара *</Label>
                      <Input
                        id="item-name"
                        placeholder="Введите название товара"
                        value={itemForm.name}
                        onChange={(e) =>
                          setItemForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-location">Локация *</Label>
                      <Select
                        value={itemForm.locationId}
                        onValueChange={(value) =>
                          setItemForm((prev) => ({ ...prev, locationId: value }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите локацию" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="item-quantity">Количество *</Label>
                      <Input
                        id="item-quantity"
                        type="number"
                        placeholder="0"
                        value={itemForm.quantity}
                        onChange={(e) =>
                          setItemForm((prev) => ({ ...prev, quantity: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-unit">Единица измерения *</Label>
                      <Select
                        value={itemForm.unit}
                        onValueChange={(value) =>
                          setItemForm((prev) => ({ ...prev, unit: value }))
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите единицу" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="шт">Штуки</SelectItem>
                          <SelectItem value="кг">Килограммы</SelectItem>
                          <SelectItem value="л">Литры</SelectItem>
                          <SelectItem value="м">Метры</SelectItem>
                          <SelectItem value="м²">Квадратные метры</SelectItem>
                          <SelectItem value="м³">Кубические метры</SelectItem>
                          <SelectItem value="упак">Упаковки</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      <Plus className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Добавление..." : "Добавить товар"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Location Tab */}
          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Добавить новую локацию
                </CardTitle>
                <CardDescription>
                  Создайте новую складскую локацию для хранения товаров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLocation} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Название локации *</Label>
                    <Input
                      id="location-name"
                      placeholder="Введите название локации"
                      value={locationForm.name}
                      onChange={(e) =>
                        setLocationForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location-address">Адрес *</Label>
                    <Textarea
                      id="location-address"
                      placeholder="Введите полный адрес локации"
                      value={locationForm.address}
                      onChange={(e) =>
                        setLocationForm((prev) => ({ ...prev, address: e.target.value }))
                      }
                      required
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                      <Plus className="mr-2 h-4 w-4" />
                      {isSubmitting ? "Добавление..." : "Добавить локацию"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Current Locations Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Текущие локации</CardTitle>
            <CardDescription>Обзор существующих складских локаций</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <div key={location.id} className="p-4 border rounded-lg">
                  <h4 className="font-medium">{location.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{location.address}</p>
                  <p className="text-xs text-muted-foreground">
                    Товаров: {location.items.length}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
