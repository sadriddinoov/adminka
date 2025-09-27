"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { Button } from "../../components/ui/button";
import { Building2, Package, MapPin, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { API_URL } from "../../config";

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
}

interface Device {
  id: number;
  device_name: string;
  description: string;
  object_name: string;
  category_name: string;
  device_count: number;
  inventory_number: string;
  full_name: string;
  created_at: string;
}

interface CategoryDetail {
  category: {
    id: number;
    category_name: string;
    object_name: string;
    created_at: string;
  };
  devices_count: number;
  device_count_total: number;
  devices: Device[];
}

interface DetailedLocation {
  object: {
    id: number;
    name: string;
    object_address: string;
    created_at: string;
  };
  categories: CategoryDetail[];
  categories_count: number;
  devices_count_total: number;
}

interface LocationDetailModalProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LocationDetailModal({
  location,
  isOpen,
  onClose,
}: LocationDetailModalProps) {
  const [detailedData, setDetailedData] = useState<DetailedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [categoriesPerPage] = useState(5); 
  const [devicePages, setDevicePages] = useState<{ [key: string]: number }>({});
  const [devicesPerPage] = useState(5); 

  useEffect(() => {
    if (location && isOpen) {
      const fetchDetailedLocation = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const token = localStorage.getItem("token");
          const res = await fetch(`${API_URL}/api/object/with-categories?object_name=${encodeURIComponent(location.name)}`, {
            headers: {
              "Content-Type": "application/json",
              Connection: "keep-alive",
              Authorization: token ? `Bearer ${token}` : "",
              "ngrok-skip-browser-warning": "true",
            },
            method: "GET",
          });

          if (!res.ok) {
            throw new Error(`Failed to fetch detailed location: ${res.statusText}`);
          }

          const data = await res.json();
          setDetailedData(data);
          // Initialize device pages for each category
          setDevicePages(
            data.categories.reduce((acc: { [key: string]: number }, cat: CategoryDetail) => {
              acc[cat.category.id] = 1;
              return acc;
            }, {})
          );
        } catch (err) {
          console.error(err);
          setError("Ошибка загрузки данных локации");
        } finally {
          setIsLoading(false);
        }
      };

      fetchDetailedLocation();
    }
  }, [location, isOpen]);

  if (!location || !isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !detailedData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{location.name}</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8 text-red-500">
            {error || "Данные не найдены"}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { object, categories, categories_count, devices_count_total } = detailedData;

  // Pagination for categories
  const indexOfLastCategory = currentCategoryPage * categoriesPerPage;
  const indexOfFirstCategory = indexOfLastCategory - categoriesPerPage;
  const currentCategories = categories.slice(indexOfFirstCategory, indexOfLastCategory);
  const totalCategoryPages = Math.ceil(categories.length / categoriesPerPage);

  const paginateCategories = (pageNumber: number) => setCurrentCategoryPage(pageNumber);

  // Pagination for devices within a category
  const paginateDevices = (categoryId: number, pageNumber: number) => {
    setDevicePages((prev) => ({
      ...prev,
      [categoryId]: pageNumber,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            {object.name}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            <MapPin className="mr-1 h-4 w-4" />
            {object.object_address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{categories_count}</div>
              <div className="text-sm text-muted-foreground">
                Категорий
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{devices_count_total}</div>
              <div className="text-sm text-muted-foreground">
                Общее количество
              </div>
            </div>
          </div>

          {/* Categories Accordion */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Категории и товары
            </h3>
            <Accordion type="single" collapsible className="w-full">
              {currentCategories.map((catDetail, index) => {
                const categoryId = catDetail.category.id;
                const currentDevicePage = devicePages[categoryId] || 1;
                const indexOfLastDevice = currentDevicePage * devicesPerPage;
                const indexOfFirstDevice = indexOfLastDevice - devicesPerPage;
                const currentDevices = catDetail.devices.slice(indexOfFirstDevice, indexOfLastDevice);
                const totalDevicePages = Math.ceil(catDetail.devices.length / devicesPerPage);

                return (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger>
                      {catDetail.category.category_name} ({catDetail.devices_count} позиций, {catDetail.device_count_total} ед.)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {currentDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div>
                              <div className="font-medium">{device.device_name}</div>
                              <div className="text-sm text-muted-foreground">
                                Инв.номер: {device.inventory_number}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Чей: {device.full_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Описание: {device.description}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {device.device_count} ед.
                              </div>
                            </div>
                          </div>
                        ))}
                        {catDetail.devices.length === 0 && (
                          <div className="text-center py-4 text-muted-foreground">
                            Нет товаров в этой категории
                          </div>
                        )}
                        {catDetail.devices.length > devicesPerPage && (
                          <div className="flex justify-between items-center mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => paginateDevices(categoryId, currentDevicePage - 1)}
                              disabled={currentDevicePage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                              Страница {currentDevicePage} из {totalDevicePages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => paginateDevices(categoryId, currentDevicePage + 1)}
                              disabled={currentDevicePage === totalDevicePages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            {categories.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                Нет категорий
              </div>
            )}
            {categories.length > categoriesPerPage && (
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginateCategories(currentCategoryPage - 1)}
                  disabled={currentCategoryPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Страница {currentCategoryPage} из {totalCategoryPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => paginateCategories(currentCategoryPage + 1)}
                  disabled={currentCategoryPage === totalCategoryPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}