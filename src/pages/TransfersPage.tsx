"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../components/layout/app-layout"
import { ActiveTransfers } from "../components/transfers/active-transfers"
import { TransferForm } from "../components/transfers/transfer-form"
import { mockAPI } from "../lib/mock-api"
import type { Location, Transfer } from "../types/api"
import { Loader2, Plus } from "lucide-react"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"

export function TransfersPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, transfersData] = await Promise.all([mockAPI.getLocations(), mockAPI.getTransfers()])
        setLocations(locationsData)
        setTransfers(transfersData)
      } catch (error) {
        console.error("Error loading transfers data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  const handleTransferCreated = (newTransfer: Transfer) => {
    setTransfers((prev) => [newTransfer, ...prev])
    setIsFormOpen(false)
    // Reload locations to reflect updated quantities
    mockAPI.getLocations().then(setLocations)
  }

  if (isLoading) {
    return (
      <AppLayout title="Трансферы" subtitle="Управление перемещением товаров">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Трансферы" subtitle="Управление перемещением товаров">
      <div className="space-y-6">
        {/* Header with Create Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Активные трансферы</h2>
            <p className="text-muted-foreground">Отслеживание перемещений товаров между локациями</p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать трансфер
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Создать новый трансфер</DialogTitle>
              </DialogHeader>
              <TransferForm
                locations={locations}
                onTransferCreated={handleTransferCreated}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Active Transfers */}
        <ActiveTransfers transfers={transfers} locations={locations} />
      </div>
    </AppLayout>
  )
}
