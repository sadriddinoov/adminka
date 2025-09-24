"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "../../components/layout/app-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { Plus, Package, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { API_URL } from "../../config";

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
}

// -------- GET Locations ----------
async function fetchObjects(): Promise<Location[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects/`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch objects: ${res.statusText}`);
  }

  const data = await res.json();
  console.log("Raw /api/objects response:", data);
  if (Array.isArray(data)) {
    return data.map((loc: any) => ({
      id: String(loc.object?.id ?? "unknown"),
      name: loc.object?.name ?? "Unknown",
      object_address: loc.object?.object_address ?? "Unknown",
      created_at: loc.object?.created_at ?? new Date().toISOString(),
    }));
  }
  return [];
}

// -------- POST Location ----------
async function postLocation(newLocation: {
  object_name: string;
  object_address: string;
}) {
  const token = localStorage.getItem("token");
  console.log("Sending POST /api/objects with:", newLocation);
  const res = await fetch(`${API_URL}/api/objects/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(newLocation),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка при добавлении локации: ${errorText}`);
  }
  return res.json();
}

// -------- POST Item ----------
async function postItem(newItem: {
  device_name: string;
  object_name: string;
  description: string;
  device_count: number;
}) {
  const token = localStorage.getItem("token");
  console.log("Sending POST /api/devices with:", newItem);
  const res = await fetch(`${API_URL}/api/devices/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(newItem),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка при добавлении товара: ${errorText}`);
  }
  return res.json();
}

export default function AddObjectsPage() {
  const [activeTab, setActiveTab] = useState("items");
  const [itemForm, setItemForm] = useState({
    device_name: "",
    object_name: "",
    description: "",
    device_count: 0,
  });
  const [locationForm, setLocationForm] = useState({
    object_name: "",
    object_address: "",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // GET objects
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ["objects"],
    queryFn: fetchObjects,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // POST Location
  const { mutate: addLocation, isPending: isAddingLocation } = useMutation({
    mutationFn: postLocation,
    onSuccess: (data) => {
      setSuccess("Локация успешно добавлена ✅");
      setError(null);
      setLocationForm({ object_name: "", object_address: "" });
      // Optimistic update: Add the new location to the cache
      queryClient.setQueryData(["objects"], (old: Location[] | undefined) => {
        const newLocation: Location = {
          id: String(data?.object?.id ?? "temp-" + Date.now()),
          name: locationForm.object_name,
          object_address: locationForm.object_address,
          created_at: new Date().toISOString(),
        };
        return [...(old ?? []), newLocation];
      });
      // Invalidate to fetch the latest data
      queryClient.invalidateQueries({ queryKey: ["objects"] });
    },
    onError: (error: any) => {
      setError(`Ошибка при добавлении локации: ${error.message} ❌`);
      setSuccess(null);
    },
  });

  // POST Item
  const { mutate: addItem, isPending: isAddingItem } = useMutation({
    mutationFn: postItem,
    onSuccess: () => {
      setSuccess("Товар успешно добавлен ✅");
      setError(null);
      setItemForm({
        device_name: "",
        object_name: "",
        description: "",
        device_count: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["objects"] }); // Refresh locations to include new item
    },
    onError: (error: any) => {
      setError(`Ошибка при добавлении товара: ${error.message} ❌`);
      setSuccess(null);
    },
  });

  const handleSubmitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!isAddingLocation) {
      addLocation(locationForm);
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!isAddingItem) {
      addItem(itemForm);
    }
  };

  return (
    <AppLayout
      title="Добавить объекты и товары"
      subtitle="Создание новых товаров и складских локаций"
    >
      <div className="max-w-4xl space-y-6">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Добавить новый товар</CardTitle>
                <CardDescription>
                  Добавьте товар в выбранную складскую локацию
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitItem} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="mb-2">Название товара *</Label>
                      <Input
                        value={itemForm.device_name}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            device_name: e.target.value,
                          }))
                        }
                        required
                        disabled={isAddingItem}
                      />
                    </div>
                    <div>
                      <Label className="mb-2">Локация *</Label>
                      <Select
                        value={itemForm.object_name}
                        onValueChange={(value) =>
                          setItemForm((prev) => ({
                            ...prev,
                            object_name: value,
                          }))
                        }
                        disabled={isAddingItem || isLoadingLocations}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите локацию" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.length > 0 ? (
                            locations.map((loc) => (
                              <SelectItem key={loc.id} value={loc.name}>
                                {loc.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>
                              Нет доступных локаций
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="mb-2">Количество *</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={itemForm.device_count || ""}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            device_count: Number(e.target.value),
                          }))
                        }
                        required
                        disabled={isAddingItem}
                      />
                    </div>
                    <div>
                      <Label className="mb-2">Описание *</Label>
                      <Textarea
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        required
                        disabled={isAddingItem}
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isAddingItem || isLoadingLocations}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isAddingItem ? "Добавление..." : "Добавить товар"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations">
            <Card>
              <CardHeader>
                <CardTitle>Добавить новую локацию</CardTitle>
                <CardDescription>
                  Создайте складскую локацию для хранения товаров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitLocation} className="space-y-4">
                  <div>
                    <Label className="mb-2">Название объекта *</Label>
                    <Input
                      value={locationForm.object_name}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          object_name: e.target.value,
                        }))
                      }
                      required
                      disabled={isAddingLocation}
                    />
                  </div>
                  <div>
                    <Label className="mb-2">Адрес *</Label>
                    <Textarea
                      value={locationForm.object_address}
                      onChange={(e) =>
                        setLocationForm((prev) => ({
                          ...prev,
                          object_address: e.target.value,
                        }))
                      }
                      required
                      disabled={isAddingLocation}
                    />
                  </div>

                  <Button type="submit" disabled={isAddingLocation}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isAddingLocation ? "Добавление..." : "Добавить локацию"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}