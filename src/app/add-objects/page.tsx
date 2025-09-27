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
import {
  Plus,
  Package,
  MapPin,
  CheckCircle,
  AlertCircle,
  Logs,
} from "lucide-react";
import { API_URL } from "../../config";

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  created_at: string;
  object_name: string;
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

async function fetchCategories(): Promise<Category[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/categories/`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch categories: ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map((cat: any) => ({
      id: String(cat.id ?? "unknown"),
      name: cat.category_name ?? "Unknown",
      created_at: cat.created_at ?? new Date().toISOString(),
      object_name: cat.object_name ?? "Unknown",
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

// -------- POST Category ----------
async function postCategory(newCategory: { category_name: string; object_name: string }) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/categories/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(newCategory),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ошибка при добавлении категории: ${errorText}`);
  }
  return res.json();
}

// -------- POST Item ----------
async function postItem(newItem: {
  device_name: string;
  object_name: string;
  category_name: string;
  description: string;
  device_count: number;
  inventory_number: string;
  full_name: string;
}) {
  const token = localStorage.getItem("token");
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
    category_name: "",
    description: "",
    device_count: 0,
    inventory_number: "",
    full_name: "",
  });
  const [locationForm, setLocationForm] = useState({
    object_name: "",
    object_address: "",
  });
  const [categoryForm, setCategoryForm] = useState({
    category_name: "",
    object_name: "",
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // GET objects
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery({
    queryKey: ["objects"],
    queryFn: fetchObjects,
  });

  // GET categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  console.log(categories[0]);

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

  // POST Category
  const { mutate: addCategory, isPending: isAddingCategory } = useMutation({
    mutationFn: postCategory,
    onSuccess: (data) => {
      setSuccess("Категория успешно добавлена ✅");
      setError(null);
      setCategoryForm({ category_name: "", object_name: "" });
      // Optimistic update: Add the new category to the cache
      queryClient.setQueryData(
        ["categories"],
        (old: Category[] | undefined) => {
          const newCategory: Category = {
            id: String(data?.category?.id ?? "temp-" + Date.now()),
            name: categoryForm.category_name,
            created_at: new Date().toISOString(),
            object_name: categoryForm.object_name,
          };
          return [...(old ?? []), newCategory];
        }
      );
      // Invalidate to fetch the latest data
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: any) => {
      setError(`Ошибка при добавлении категории: ${error.message} ❌`);
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
        category_name: "",
        description: "",
        device_count: 0,
        inventory_number: "",
        full_name: "",
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

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!isAddingCategory) {
      addCategory(categoryForm);
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    if (!isAddingItem) {
      addItem(itemForm);
    }
  };

  const filteredCategories = itemForm.object_name
    ? categories.filter((cat) => cat.object_name === itemForm.object_name)
    : [];

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="items" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Добавить товар
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center">
              <Logs className="mr-2 h-4 w-4" />
              Добавить категорию
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              Добавить локацию
            </TabsTrigger>
          </TabsList>

          <TabsContent className="mt-4" value="items">
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

                  <div>
                    <Label className="mb-2">Категория *</Label>
                    <Select
                      value={itemForm.category_name}
                      onValueChange={(value) =>
                        setItemForm((prev) => ({
                          ...prev,
                          category_name: value,
                        }))
                      }
                      disabled={isAddingItem || isLoadingCategories || !itemForm.object_name}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            {itemForm.object_name
                              ? "Нет доступных категорий для этой локации"
                              : "Сначала выберите локацию"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="mb-2">Инвент.номер *</Label>
                      <Input
                        value={itemForm.inventory_number || ""}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            inventory_number: e.target.value,
                          }))
                        }
                        required
                        disabled={isAddingItem}
                      />
                    </div>
                    <div>
                      <Label className="mb-2">Чей *</Label>
                      <Input
                        value={itemForm.full_name}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            full_name: e.target.value,
                          }))
                        }
                        required
                        disabled={isAddingItem}
                      />
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

                  <Button
                    type="submit"
                    disabled={
                      isAddingItem || isLoadingLocations || isLoadingCategories
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {isAddingItem ? "Добавление..." : "Добавить товар"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4" value="categories">
            <Card className="">
              <CardHeader>
                <CardTitle>Добавить новую категорию</CardTitle>
                <CardDescription>
                  Добавьте категорию для товаров
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmitCategory}
                  className="space-y-4 grid grid-cols-2 gap-4"
                >
                  <div className="">
                    <div>
                      <Label className="mb-2">Название категории *</Label>
                      <Input
                        value={categoryForm.category_name}
                        onChange={(e) =>
                          setCategoryForm((prev) => ({
                            ...prev,
                            category_name: e.target.value,
                          }))
                        }
                        required
                        disabled={isAddingCategory}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2">Локация *</Label>
                    <Select
                      value={categoryForm.object_name}
                      onValueChange={(value) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          object_name: value,
                        }))
                      }
                      disabled={isAddingCategory || isLoadingLocations}
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

                  <Button type="submit" disabled={isAddingCategory} className="col-span-2">
                    <Plus className="mr-2 h-4 w-4" />
                    {isAddingCategory ? "Добавление..." : "Добавить категорию"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="mt-4" value="locations">
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