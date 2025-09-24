"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/app-layout";
import { StatsCards } from "../components/dashboard/stats-cards";
import { LocationsGrid } from "../components/dashboard/locations-grid";
import { RecentTransfers } from "../components/dashboard/recent-transfers";
import { LocationDetailModal } from "../components/dashboard/location-detail-modal";
import { Loader2 } from "lucide-react";
import { API_URL } from "../config";

interface Location {
  id: string;
  name: string;
  address: string;
  created_at: string;
  items: { id: string; name: string; quantity: number; unit: string }[];
}

interface TransferItem {
  name: string;
  quantity: number;
}

interface Transfer {
  id: string;
  fromLocation: string;
  toLocation: string;
  items: TransferItem[];
  createdAt: string;
  status: "pending" | "completed" | "failed";
  error?: string | null;
}

async function fetchLocations(): Promise<Location[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
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
  if (Array.isArray(data)) {
    return data.map((loc: any) => ({
      id: String(loc.object.id),
      name: loc.object.name || "Unknown",
      address: loc.object.object_address || "Unknown",
      created_at: loc.object.created_at || new Date().toISOString(),
      items: Array.isArray(loc.devices)
        ? loc.devices.map((device: any) => ({
            id: String(device.id),
            name: device.device_name || "Unknown",
            quantity: device.device_count || 0,
            unit: "шт.",
          }))
        : [],
    }));
  }
  return [];
}

async function fetchTransfers(limit: number = 5) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/transfer/history?limit=${limit}`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
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
          id: String(transfer.id),
          fromLocation: transfer.object_from || "Unknown",
          toLocation: transfer.object_to || "Unknown",
          items: Array.isArray(transfer.devices)
            ? [{ name: transfer.devices.join(", "), quantity: transfer.device_count || 0 }]
            : [],
          createdAt: transfer.created_at || new Date().toISOString(),
          status: "completed" as const,
          error: null,
        })),
      total: data.total != null ? data.total : data.items.length,
    };
  }
  return { items: [], total: 0 };
}

export function DashboardPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, transfersData] = await Promise.all([
          fetchLocations(),
          fetchTransfers(),
        ]);
        setLocations(locationsData);
        setTransfers(transfersData.items);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <AppLayout title="Панель управления" subtitle="Обзор складских операций">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Панель управления" subtitle="Обзор складских операций">
      <div className="space-y-6">
        {/* Stats Cards */}
        <StatsCards locations={locations} transfers={transfers} />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Locations - Takes 2 columns */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Складские локации</h2>
              <p className="text-sm text-muted-foreground">
                Управление товарами по локациям
              </p>
            </div>
            <LocationsGrid
              locations={locations}
              onViewLocation={setSelectedLocation}
            />
          </div>

          {/* Recent Transfers - Takes 1 column */}
          <div>
            <RecentTransfers transfers={transfers} locations={locations} />
          </div>
        </div>

        {/* Location Detail Modal */}
        {selectedLocation && (
          <LocationDetailModal
            location={selectedLocation}
            isOpen={!!selectedLocation}
            onClose={() => setSelectedLocation(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}