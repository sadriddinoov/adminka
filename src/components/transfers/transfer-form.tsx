"use client"

import { useState, useEffect } from "react"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Badge } from "../../components/ui/badge"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { Separator } from "../../components/ui/separator"
import { ArrowRight, Plus, Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { mockAPI, type Location, type Item, type TransferItem } from "../../lib/mock-api"
import { useAuth } from "@/hooks/use-auth"

interface TransferFormProps {
  onTransferComplete: () => void
}

export function TransferForm({ onTransferComplete }: TransferFormProps) {
  const [locations, setLocations] = useState<Location[]>([])
  const [fromLocation, setFromLocation] = useState<string>("")
  const [toLocation, setToLocation] = useState<string>("")
  const [transferItems, setTransferItems] = useState<TransferItem[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await mockAPI.getLocations()
        setLocations(data)
      } catch (error) {
        console.error("Error loading locations:", error)
      }
    }
    loadLocations()
  }, [])

  useEffect(() => {
    if (fromLocation) {
      const location = locations.find((l) => l.id === fromLocation)
      setAvailableItems(location?.items || [])
      setTransferItems([])
    }
  }, [fromLocation, locations])

  const addTransferItem = () => {
    setTransferItems([...transferItems, { itemId: "", quantity: 0 }])
  }

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index))
  }

  const updateTransferItem = (index: number, field: keyof TransferItem, value: string | number) => {
    const updated = [...transferItems]
    updated[index] = { ...updated[index], [field]: value }
    setTransferItems(updated)
  }

  const getItemName = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId)?.name || ""
  }

  const getItemUnit = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId)?.unit || ""
  }

  const getAvailableQuantity = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId)?.quantity || 0
  }

  const validateTransfer = () => {
    if (!fromLocation || !toLocation) {
      return "Выберите исходную и целевую локации"
    }

    if (fromLocation === toLocation) {
      return "Исходная и целевая локации не могут совпадать"
    }

    if (transferItems.length === 0) {
      return "Добавьте хотя бы один товар для трансфера"
    }

    for (const item of transferItems) {
      if (!item.itemId) {
        return "Выберите товар для всех позиций"
      }
      if (item.quantity <= 0) {
        return "Количество должно быть больше нуля"
      }
      const available = getAvailableQuantity(item.itemId)
      if (item.quantity > available) {
        return `Недостаточно товара "${getItemName(item.itemId)}" (доступно: ${available})`
      }
    }

    return null
  }

  const handleSubmit = async () => {
    const validationError = validateTransfer()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      await mockAPI.createTransfer({
        fromLocation,
        toLocation,
        items: transferItems,
        createdBy: user?.id || "admin",
      })

      setSuccess("Трансфер успешно выполнен!")
      setFromLocation("")
      setToLocation("")
      setTransferItems([])
      setAvailableItems([])
      onTransferComplete()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Ошибка выполнения трансфера")
    } finally {
      setIsLoading(false)
    }
  }

  const fromLocationName = locations.find((l) => l.id === fromLocation)?.name || ""
  const toLocationName = locations.find((l) => l.id === toLocation)?.name || ""

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создать трансфер</CardTitle>
        <CardDescription>Перемещение товаров между складскими локациями</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location Selection */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-location">Откуда</Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите исходную локацию" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} disabled={location.id === toLocation}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="to-location">Куда</Label>
            <Select value={toLocation} onValueChange={setToLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите целевую локацию" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id} disabled={location.id === fromLocation}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Transfer Preview */}
        {fromLocation && toLocation && (
          <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-4">
              <Badge variant="outline">{fromLocationName}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline">{toLocationName}</Badge>
            </div>
          </div>
        )}

        <Separator />

        {/* Items Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Товары для трансфера</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTransferItem}
              disabled={!fromLocation || availableItems.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Добавить товар
            </Button>
          </div>

          {transferItems.length === 0 && fromLocation && (
            <div className="text-center py-8 text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Добавьте товары для трансфера</p>
            </div>
          )}

          {transferItems.map((item, index) => {
            const selectedItem = availableItems.find((ai) => ai.id === item.itemId)
            const isQuantityValid = item.quantity > 0 && item.quantity <= (selectedItem?.quantity || 0)

            return (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Товар #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransferItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Товар</Label>
                    <Select value={item.itemId} onValueChange={(value) => updateTransferItem(index, "itemId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите товар" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableItems.map((availableItem) => (
                          <SelectItem key={availableItem.id} value={availableItem.id}>
                            <div className="flex justify-between w-full">
                              <span>{availableItem.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {availableItem.quantity} {availableItem.unit}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Количество</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="1"
                        max={selectedItem?.quantity || 0}
                        value={item.quantity || ""}
                        onChange={(e) => updateTransferItem(index, "quantity", Number.parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className={!isQuantityValid && item.quantity > 0 ? "border-destructive" : ""}
                      />
                      {selectedItem && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                          {selectedItem.unit}
                        </div>
                      )}
                    </div>
                    {selectedItem && (
                      <p className="text-xs text-muted-foreground">
                        Доступно: {selectedItem.quantity} {selectedItem.unit}
                      </p>
                    )}
                  </div>
                </div>

                {!isQuantityValid && item.quantity > 0 && selectedItem && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Недостаточно товара. Доступно: {selectedItem.quantity} {selectedItem.unit}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )
          })}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isLoading || transferItems.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Выполняется...
              </>
            ) : (
              "Выполнить трансфер"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
