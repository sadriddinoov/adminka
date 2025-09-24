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

// -------- GET Locations ----------
async function fetchObjects() {
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

  return await res.json();
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
    },
    body: JSON.stringify(newLocation),
  });
  if (!res.ok) throw new Error("Ошибка при добавлении локации");
  return res.json();
}

async function postItem(newItem: {
  device_name: string;
  object_name: string;
  description: string;
  device_count: number;
}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/devices/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify(newItem),
  });
  if (!res.ok) throw new Error("Ошибка при добавлении товара");
  return res.json();
}

export default function AddObjectsPage() {
  const [activeTab, setActiveTab] = useState("items");

  // Forms state
  const [itemForm, setItemForm] = useState({
    device_name: "",
    object_name: "",
    description: "",
    device_count: 0
  });

  const [locationForm, setLocationForm] = useState({
    object_name: "",
    object_address: "",
  });

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // GET objects
  const {
    data: locations,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["objects"],
    queryFn: fetchObjects,
  });
  console.log(locations);

  // POST Location
  const { mutate: addLocation, isPending: isAddingLocation } = useMutation({
    mutationFn: postLocation,
    onSuccess: () => {
      setSuccess("Локация успешно добавлена ✅");
      setError(null);
      setLocationForm({ object_name: "", object_address: "" });
      queryClient.invalidateQueries({ queryKey: ["objects"] });
    },
    onError: () => {
      setError("Ошибка при добавлении локации ❌");
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
    },
    onError: () => {
      setError("Ошибка при добавлении товара ❌");
      setSuccess(null);
    },
  });

  const handleSubmitLocation = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation(locationForm);
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItem(itemForm);
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

          {/* Items tab */}
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
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите локацию" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map((loc: any) => (
                            <SelectItem key={loc.id} value={loc.name}>
                              {loc.name}
                            </SelectItem>
                          ))}
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
                        value={itemForm.device_count}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            device_count: Number(e.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label className="mb-2">Описание *</Label>
                      <Textarea
                        className=""
                        value={itemForm.description}
                        onChange={(e) =>
                          setItemForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={isAddingItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    {isAddingItem ? "Добавление..." : "Добавить товар"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations tab */}
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
