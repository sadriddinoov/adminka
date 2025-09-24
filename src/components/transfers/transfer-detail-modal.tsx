"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { Badge } from "../../components/ui/badge"
import { Separator } from "../../components/ui/separator"
import { ArrowRight, Clock, CheckCircle, XCircle, User, Calendar } from "lucide-react"

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
}

interface Transfer {
  id: string;
  object_from: string;
  object_to: string;
  devices: string[];
  device_count: number;
  created_at: string;
  status: "pending" | "completed" | "failed";
  createdBy: string;
}

interface TransferDetailModalProps {
  transfer: Transfer | null
  locations: Location[]
  isOpen: boolean
  onClose: () => void
}

export function TransferDetailModal({ transfer, locations, isOpen, onClose }: TransferDetailModalProps) {
  if (!transfer) return null

  const getLocationName = (objectName: string) => {
    return locations.find((l) => l.name === objectName)?.name || objectName
  }

  const getStatusIcon = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStatusIcon(transfer.status)}
            <span>Трансфер #{transfer.id}</span>
          </DialogTitle>
          <DialogDescription>Детальная информация о трансфере товаров</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Route */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="font-medium">{getLocationName(transfer.object_from)}</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{getLocationName(transfer.object_to)}</span>
            </div>
            {getStatusBadge(transfer.status)}
          </div>

          <Separator />

          {/* Transfer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                Создан: {formatDate(transfer.created_at)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{transfer.devices.length}</div>
              <div className="text-sm text-muted-foreground">товарных позиций</div>
              <div className="text-lg font-semibold mt-1">{transfer.device_count}</div>
              <div className="text-sm text-muted-foreground">общее количество</div>
            </div>
          </div>

          <Separator />

          {/* Items List */}
          <div>
            <h3 className="font-semibold mb-4">Товары в трансфере</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transfer.devices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{device}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {transfer.device_count} шт.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}