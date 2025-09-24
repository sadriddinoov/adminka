import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Building2, Package, Eye } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  created_at: string;
  items: { id: string; name: string; quantity: number; unit: string }[];
}

interface LocationsGridProps {
  locations: Location[];
  onViewLocation: (location: Location) => void;
}

export function LocationsGrid({ locations, onViewLocation }: LocationsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {locations.map((location) => {
        const totalQuantity = location.items.reduce((sum, item) => sum + item.quantity, 0);
        const lowStockItems = location.items.filter((item) => item.quantity < 5).length;

        return (
          <Card key={location.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  {location.name}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => onViewLocation(location)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{location.address}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Товарных позиций:</span>
                  <Badge variant="secondary">{location.items.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Общее количество:</span>
                  <Badge variant="outline">{totalQuantity}</Badge>
                </div>
                {lowStockItems > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Низкий остаток:</span>
                    <Badge variant="destructive">{lowStockItems}</Badge>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2 flex items-center">
                  <Package className="mr-1 h-4 w-4" />
                  Товары:
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {location.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className={item.quantity < 5 ? "text-destructive font-medium" : ""}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}