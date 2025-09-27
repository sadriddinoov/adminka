"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Separator } from "../../components/ui/separator";
import { ArrowRight, Plus, Trash2, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { API_URL } from "../../config";
import toast from "react-hot-toast";

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface TransferItem {
  itemId: string;
  quantity: number;
  full_name: string;
}

async function fetchLocations() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.statusText}`);
  const data = await res.json();
  console.log("API /api/objects response:", data);
  return Array.isArray(data)
    ? data.map((loc: any) => ({
        id: loc.object.id.toString(),
        name: loc.object.name,
        object_address: loc.object.object_address,
        created_at: loc.object.created_at,
      }))
    : [];
}

async function fetchDevices(objectName: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch devices: ${res.statusText}`);
  const data = await res.json();
  console.log("API /api/objects response for devices:", data);
  const location = Array.isArray(data)
    ? data.find((loc: any) => loc.object.name === objectName)
    : null;
  return location && Array.isArray(location.devices)
    ? location.devices.map((d: any) => ({
        id: d.id.toString(),
        name: d.device_name,
        quantity: d.device_count,
        unit: "шт.",
      }))
    : [];
}

async function createTransfer(device_name: string, from_object_name: string, to_object_name: string, device_count: number, full_name: string) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/transfer`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "POST",
    body: JSON.stringify({
      device_name,
      from_object_name,
      to_object_name,
      device_count,
      full_name,
    }),
  });

  if (!res.ok) throw new Error(`Failed to create transfer: ${res.statusText}`);
  return res.json();
}

export function TransferForm({ onTransferComplete }: TransferFormProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [fromLocation, setFromLocation] = useState<string>("");
  const [toLocation, setToLocation] = useState<string>("");
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await fetchLocations();
        setLocations(data);
      } catch (err) {
        console.error("Error loading locations:", err);
        setError("Ошибка загрузки локаций");
        setLocations([]);
      }
    };
    loadLocations();
  }, []);

  useEffect(() => {
    const loadAvailableItems = async () => {
      if (fromLocation && Array.isArray(locations)) {
        const location = locations.find((l) => l.id === fromLocation);
        if (location) {
          try {
            const data = await fetchDevices(location.name);
            setAvailableItems(data);
            setTransferItems([]);
          } catch (err) {
            console.error("Error loading devices:", err);
            setError("Ошибка загрузки товаров");
            setAvailableItems([]);
          }
        } else {
          setAvailableItems([]);
          setTransferItems([]);
        }
      } else {
        setAvailableItems([]);
        setTransferItems([]);
      }
    };
    loadAvailableItems();
  }, [fromLocation, locations]);

  const addTransferItem = () => {
    setTransferItems([...transferItems, { itemId: "", quantity: 1, full_name: "" }]);
  };

  const removeTransferItem = (index: number) => {
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const updateTransferItem = (index: number, field: keyof TransferItem, value: string | number) => {
    const updated = [...transferItems];
    updated[index] = { ...updated[index], [field]: value };
    setTransferItems(updated);
  };

  const getItemName = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId)?.name || "";
  };

  const getAvailableQuantity = (itemId: string) => {
    return availableItems.find((item) => item.id === itemId)?.quantity || 0;
  };

  const validateTransfer = () => {
    if (!fromLocation || !toLocation) {
      return "Выберите исходную и целевую локации";
    }

    if (fromLocation === toLocation) {
      return "Исходная и целевая локации не могут совпадать";
    }

    if (transferItems.length === 0) {
      return "Добавьте хотя бы один товар для трансфера";
    }

    for (const item of transferItems) {
      if (!item.itemId) {
        return "Выберите товар для всех позиций";
      }
      if (!item.full_name) {
        return "Укажите поле 'Чей' для всех товаров";
      }
      if (item.quantity <= 0) {
        return "Количество должно быть больше нуля";
      }
      const available = getAvailableQuantity(item.itemId);
      if (item.quantity > available) {
        return `Недостаточно товара "${getItemName(item.itemId)}" (доступно: ${available})`;
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateTransfer();
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const fromLocationName = locations.find((l) => l.id === fromLocation)?.name;
      const toLocationName = locations.find((l) => l.id === toLocation)?.name;

      if (!fromLocationName || !toLocationName) {
        throw new Error("Не удалось определить названия локаций");
      }

      for (const item of transferItems) {
        const deviceName = getItemName(item.itemId);
        if (!deviceName) {
          throw new Error(`Не удалось определить название устройства для ID ${item.itemId}`);
        }

        await createTransfer(deviceName, fromLocationName, toLocationName, item.quantity, item.full_name);
      }

      toast.success("Трансфер успешно выполнен!");
      setSuccess("Трансфер успешно выполнен!");
      setFromLocation("");
      setToLocation("");
      setTransferItems([]);
      setAvailableItems([]);
      onTransferComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка выполнения трансфера";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fromLocationName = locations.find((l) => l.id === fromLocation)?.name || "";
  const toLocationName = locations.find((l) => l.id === toLocation)?.name || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Создать трансфер</CardTitle>
        <CardDescription>Перемещение товаров между складскими локациями</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-location">Откуда</Label>
            <Select value={fromLocation} onValueChange={setFromLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите исходную локацию" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem
                    key={location.id}
                    value={location.id}
                    disabled={location.id === toLocation}
                  >
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
                  <SelectItem
                    key={location.id}
                    value={location.id}
                    disabled={location.id === fromLocation}
                  >
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
            <div className="text-center py-2 text-muted-foreground">
              <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>Добавьте товары для трансфера</p>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {transferItems.map((item, index) => {
              const selectedItem = availableItems.find((ai) => ai.id === item.itemId);
              const isQuantityValid = item.quantity > 0 && item.quantity <= (selectedItem?.quantity || 0);

              return (
                <div key={index} className="p-4 border rounded-lg space-y-3 mb-3">
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

                  <div className="grid gap-3 md:grid-cols-3">
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
                      <Label>Чей</Label>
                      <Input
                        value={item.full_name}
                        onChange={(e) => updateTransferItem(index, "full_name", e.target.value)}
                        placeholder="Введите имя"
                        className={item.full_name === "" ? "border-destructive" : ""}
                      />
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
                  {item.full_name === "" && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Поле "Чей" обязательно для заполнения
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
  );
}