"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/app-layout";
import { TransferForm } from "../components/transfers/transfer-form";
import { Loader2, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { API_URL } from "../config";
import toast from "react-hot-toast";
import { TransferHistoryTable } from "../components/history/transfer-history-table";
import { TransferDetailModal } from "../components/transfers/transfer-detail-modal";

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

async function fetchLocations() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    console.error("Failed to fetch locations:", res.status, res.statusText);
    throw new Error(`Failed to fetch locations: ${res.statusText}`);
  }
  const data = await res.json();
  console.log("Raw /api/objects response:", data);
  return Array.isArray(data)
    ? data
        .filter((loc: any) => loc && loc.id != null) // Filter out invalid entries
        .map((loc: any) => ({
          ...loc,
          id: String(loc.id), // Convert to string safely
          name: loc.name || "Unknown",
          object_address: loc.object_address || "",
          created_at: loc.created_at || new Date().toISOString(),
        }))
    : [];
}

async function fetchTransfers(page: number, limit: number = 10) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/transfer/history?page=${page}&limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    console.error("Failed to fetch transfers:", res.status, res.statusText);
    throw new Error(`Failed to fetch transfers: ${res.statusText}`);
  }
  const data = await res.json();
  console.log("Raw /api/transfer/history response:", data);
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items
        .filter((transfer: any) => transfer && transfer.id != null)
        .map((transfer: any) => ({
          ...transfer,
          id: String(transfer.id),
          devices: Array.isArray(transfer.devices)
            ? transfer.devices.map((device: string) => device.replace(/[{}]/g, ""))
            : [],
          object_from: transfer.object_from || "Unknown",
          object_to: transfer.object_to || "Unknown",
          device_count: transfer.device_count || 0,
          created_at: transfer.created_at || new Date().toISOString(),
          status: "completed" as const,
          createdBy: "Unknown",
        })),
      total: data.total != null ? data.total : data.items.length,
    };
  }
  return { items: [], total: 0 };
}

export function TransfersPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [locationsData, transfersData] = await Promise.all([
          fetchLocations(),
          fetchTransfers(currentPage),
        ]);
        console.log("Processed locations:", locationsData);
        console.log("Processed transfers:", transfersData.items, "Total:", transfersData.total);
        setLocations(locationsData);
        setTransfers(transfersData.items);
        setTotalItems(transfersData.total);
      } catch (error) {
        console.error("Error loading transfers data:", error);
        toast.error("Ошибка загрузки данных");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentPage]);

  const handleTransferCreated = (newTransfer: Transfer) => {
    setTransfers((prev) => [newTransfer, ...prev.slice(0, 9)]);
    setTotalItems((prev) => prev + 1);
    setIsFormOpen(false);
    setCurrentPage(1); // Reset to first page to show new transfer
    fetchLocations()
      .then((data) => {
        setLocations(data);
        toast.success("Локации обновлены");
      })
      .catch((err) => {
        console.error("Error reloading locations:", err);
        toast.error("Ошибка обновления локаций");
      });
  };

  if (isLoading) {
    return (
      <AppLayout title="Трансферы" subtitle="Управление перемещением товаров">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Трансферы" subtitle="Управление перемещением товаров">
      <div className="space-y-6">
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
            <DialogContent className="min-w-[600px] max-h-[95vh] overflow-y-auto">
              <TransferForm
                onTransferCreated={handleTransferCreated}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div className="mt-4">
          <TransferHistoryTable
            transfers={transfers}
            locations={locations}
            onViewTransfer={setSelectedTransfer}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={10}
          />
          <TransferDetailModal
            transfer={selectedTransfer}
            locations={locations}
            isOpen={!!selectedTransfer}
            onClose={() => setSelectedTransfer(null)}
          />
        </div>
      </div>
    </AppLayout>
  );
}