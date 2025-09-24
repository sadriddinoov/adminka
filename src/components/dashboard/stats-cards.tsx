"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Building2, Package, ArrowLeftRight } from "lucide-react";
import { API_URL } from "../../config";

interface StatsApiResponse {
  time: string;
  total_locations: number;
  total_devices: number;
  total_transfers: number;
  per_object: {
    object_id: number;
    object_name: string;
    devices_count: number;
  }[];
}

async function fetchStats() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}/api/stats`, {
    headers: {
      "Content-Type": "application/json",
      "Connection": "keep-alive",
      Authorization: token ? `Bearer ${token}` : "",
      "ngrok-skip-browser-warning": "true",
    },
    method: "GET",
  });

  if (!res.ok) throw new Error(`Failed to fetch stats: ${res.statusText}`);
  return res.json();
}

export function StatsCards() {
  const { data, isLoading } = useQuery<StatsApiResponse>({
    queryKey: ["stats"],
    queryFn: fetchStats
  });

  console.log(data)

  const stats = [
    {
      title: "Всего локаций",
      value: data?.total_locations ?? 0,
      icon: Building2,
    },
    {
      title: "Товары",
      value: data?.total_devices ?? 0,
      icon: Package,
    },
    {
      title: "Трансферы",
      value: data?.total_transfers ?? 0,
      icon: ArrowLeftRight,
    },
  ];

  // Обработка состояния загрузки
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Загрузка...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">...</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}