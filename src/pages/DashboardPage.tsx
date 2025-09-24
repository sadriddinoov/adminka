"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "../components/layout/app-layout";
import { StatsCards } from "../components/dashboard/stats-cards";
import { LocationsGrid } from "../components/dashboard/locations-grid";
import { RecentTransfers } from "../components/dashboard/recent-transfers";
import { LocationDetailModal } from "../components/dashboard/location-detail-modal";
// import { mockAPI } from "../lib/mock-api";
// import type { Location, Transfer } from "../types/api";
import { Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getObjects } from "../config/api";

export function DashboardPage() {
  // const [locations, setLocations] = useState<Location[]>([]);
  // const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  const {
    data: locations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["objects"],
    queryFn: () => getObjects(),
  });
  console.log("api locatins", locations);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Xatolik yuz berdi</p>;
  if (isLoading) {
    return (
      <AppLayout title="Панель управления" subtitle="Обзор складских операций">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }
  console.log("loations", locations);

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
