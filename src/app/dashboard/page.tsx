"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "../../components/layout/app-layout";
import { StatsCards } from "../../components/dashboard/stats-cards";
import { LocationsGrid } from "../../components/dashboard/locations-grid";
import { RecentTransfers } from "../../components/dashboard/recent-transfers";
import { LocationDetailModal } from "../../components/dashboard/location-detail-modal";
import { Loader2 } from "lucide-react";
import { API_URL } from "../../config";

interface Location {
  id: string;
  name: string;
  object_address: string;
  created_at: string;
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
  status: "completed" | "pending" | "failed";
  error?: string | null;
}

async function fetchLocations(): Promise<Location[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/objects/`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch objects: ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map((loc: any) => ({
      id: String(loc.object?.id ?? "unknown"),
      name: loc.object?.name ?? "Unknown",
      object_address: loc.object?.object_address ?? "Unknown",
      created_at: loc.object?.created_at ?? new Date().toISOString(),
    }));
  }
  return [];
}

async function fetchTransfers(): Promise<Transfer[]> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/transfers/`, {
    headers: {
      "Content-Type": "application/json",
      Connection: "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch transfers: ${res.statusText}`);
  }

  const data = await res.json();
  if (Array.isArray(data)) {
    return data.map((tr: any) => ({
      id: String(tr.id),
      fromLocation: tr.object_from,
      toLocation: tr.object_to,
      items: tr.devices.map((d: any) => ({ name: d.device_name, quantity: d.device_count })),
      createdAt: tr.created_at,
      status: tr.status || "completed", // assume
      error: tr.error,
    }));
  }
  return [];
}

export default function DashboardPage() {
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
        setTransfers(transfersData);
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
        <StatsCards />

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
      </div>

      {/* Location Detail Modal */}
      <LocationDetailModal
        location={selectedLocation}
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
      />
    </AppLayout>
  );
}