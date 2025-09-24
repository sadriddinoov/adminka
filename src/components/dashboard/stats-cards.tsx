"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Building2,
  Package,
  ArrowLeftRight,
  AlertTriangle,
} from "lucide-react";
import type { Location, Transfer } from "@/src/lib/mock-api";

interface StatsCardsProps {
  locations: Location[];
  transfers: Transfer[];
}

export function StatsCards({ locations, transfers }: StatsCardsProps) {
  const totalItems = locations.reduce(
    (sum, location) => sum + location.items.length,
    0
  );
  const totalQuantity = locations.reduce(
    (sum, location) =>
      sum +
      location.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const pendingTransfers = transfers.filter(
    (t) => t.status === "pending"
  ).length;
  const failedTransfers = transfers.filter((t) => t.status === "failed").length;

  const stats = [
    {
      title: "Всего локаций",
      value: locations.length,
      icon: Building2,
      description: "Активных складов",
    },
    {
      title: "Товарных позиций",
      value: totalItems,
      icon: Package,
      description: `Общее количество: ${totalQuantity}`,
    },
    {
      title: "Активных трансферов",
      value: pendingTransfers,
      icon: ArrowLeftRight,
      description: "Ожидают выполнения",
    },
    {
      title: "Неудачных трансферов",
      value: failedTransfers,
      icon: AlertTriangle,
      description: "Требуют внимания",
      variant: failedTransfers > 0 ? "destructive" : "default",
    },
  ];

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
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
