"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { ArrowRight, Clock, Eye } from "lucide-react"
import type { Transfer, Location } from "@/src/lib/mock-api"

interface ActiveTransfersProps {
  transfers: Transfer[]
  locations: Location[]
  onViewTransfer: (transfer: Transfer) => void
}

export function ActiveTransfers({ transfers, locations, onViewTransfer }: ActiveTransfersProps) {
  const getLocationName = (id: string) => {
    return locations.find((l) => l.id === id)?.name || id
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const activeTransfers = transfers.filter((t) => t.status === "pending")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2 h-5 w-5" />
          Активные трансферы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeTransfers.map((transfer) => (
            <div key={transfer.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                    <Clock className="mr-1 h-3 w-3" />
                    Ожидает
                  </Badge>
                  <span className="text-sm text-muted-foreground">#{transfer.id}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => onViewTransfer(transfer)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center space-x-4 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{getLocationName(transfer.fromLocation)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getLocationName(transfer.toLocation)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{transfer.items.length} позиций</span>
                <span>Создан: {formatDate(transfer.createdAt)}</span>
              </div>

              <div className="flex flex-wrap gap-1 mt-2">
                {transfer.items.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item.quantity} ед.
                  </Badge>
                ))}
                {transfer.items.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{transfer.items.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          ))}

          {activeTransfers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Нет активных трансферов</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
