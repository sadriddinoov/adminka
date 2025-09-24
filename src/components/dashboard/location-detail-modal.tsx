"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";
import { Building2, Package, MapPin } from "lucide-react";
import type { Location } from "@/src/lib/mock-api";

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
  if (!location) return null;

  const totalQuantity = location.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const lowStockItems = location.items.filter((item) => item.quantity < 5);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            {location.name}
          </DialogTitle>
          <DialogDescription className="flex items-center">
            <MapPin className="mr-1 h-4 w-4" />
            {location.address}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{location.items.length}</div>
              <div className="text-sm text-muted-foreground">
                Товарных позиций
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{totalQuantity}</div>
              <div className="text-sm text-muted-foreground">
                Общее количество
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-destructive">
                {lowStockItems.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Низкий остаток
              </div>
            </div>
          </div>

          {/* Items list */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Товары на складе
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {location.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {item.id}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        item.quantity < 5 ? "text-destructive" : ""
                      }`}
                    >
                      {item.quantity} {item.unit}
                    </div>
                    {item.quantity < 5 && (
                      <Badge variant="destructive" className="text-xs">
                        Низкий остаток
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low stock warning */}
          {lowStockItems.length > 0 && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h4 className="font-semibold text-destructive mb-2">
                Внимание: Низкий остаток товаров
              </h4>
              <div className="space-y-1">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="text-sm">
                    {item.name}: {item.quantity} {item.unit}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
