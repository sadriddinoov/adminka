import { useState, useEffect } from "react"
import { AppLayout } from "../../components/layout/app-layout"
import { TransferHistoryTable } from "../../components/history/transfer-history-table"
import { TransferDetailModal } from "../../components/transfers/transfer-detail-modal"
import { mockAPI, type Location, type Transfer } from "../../lib/mock-api"
import { Loader2 } from "lucide-react"

export function HistoryPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, transfersData] = await Promise.all([
          mockAPI.getLocations(),
          mockAPI.getTransfers(),
        ])
        setLocations(locationsData)
        setTransfers(transfersData)
      } catch (error) {
        console.error("Error loading history data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  if (isLoading) {
    return (
      <AppLayout title="История трансферов" subtitle="Полная история всех операций">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="История трансферов" subtitle="Полная история всех операций">
      <TransferHistoryTable
        transfers={transfers}
        locations={locations}
        onViewTransfer={setSelectedTransfer}
      />

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
