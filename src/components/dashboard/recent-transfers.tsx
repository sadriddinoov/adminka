"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { ArrowRight, Clock, CheckCircle, XCircle } from "lucide-react"
import type { Transfer, Location } from "../../../src/lib/mock-api"

interface RecentTransfersProps {
  transfers: Transfer[]
  locations: Location[]
}

export function RecentTransfers({ transfers, locations }: RecentTransfersProps) {
  const getLocationName = (id: string) => {
    return locations.find((l) => l.id === id)?.name || id
  }

  const getStatusIcon = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Завершен</Badge>
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Ожидает</Badge>
      case "failed":
        return <Badge variant="destructive">Ошибка</Badge>
    }
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

  const recentTransfers = transfers.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние трансферы</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentTransfers.map((transfer) => (
            <div key={transfer.id} className="flex items-center space-x-4 p-3 rounded-lg border">
              <div className="flex-shrink-0">{getStatusIcon(transfer.status)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">{getLocationName(transfer.fromLocation)}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{getLocationName(transfer.toLocation)}</span>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs text-muted-foreground">
                    {transfer.items.length} позиций • {formatDate(transfer.createdAt)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
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

                {transfer.error && <p className="text-xs text-destructive mt-1">{transfer.error}</p>}
              </div>

              <div className="flex-shrink-0">{getStatusBadge(transfer.status)}</div>
            </div>
          ))}

          {recentTransfers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowRight className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Трансферы не найдены</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
