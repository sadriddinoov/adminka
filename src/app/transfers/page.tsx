"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/app-layout"
import { TransferForm } from "../../components/transfers/transfer-form"
import { ActiveTransfers } from "../../components/transfers/active-transfers"
import { TransferDetailModal } from "../../components/transfers/transfer-detail-modal"
import { mockAPI, type Location, type Transfer } from "../../lib/mock-api"
import { Loader2 } from "lucide-react"

export default function TransfersPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    loadData()
  }, [])

  const handleTransferComplete = () => {
    loadData() // Reload data after successful transfer
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
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Transfer Form - Takes 2 columns */}
        <div className="lg:col-span-2">
          <TransferForm onTransferComplete={handleTransferComplete} />
        </div>

        {/* Active Transfers - Takes 1 column */}
        <div>
          <ActiveTransfers transfers={transfers} locations={locations} onViewTransfer={setSelectedTransfer} />
        </div>
      </div>

      {/* Transfer Detail Modal */}
      <TransferDetailModal
        transfer={selectedTransfer}
        locations={locations}
        isOpen={!!selectedTransfer}
        onClose={() => setSelectedTransfer(null)}
      />
    </AppLayout>
  )
}
