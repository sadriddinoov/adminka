"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { ArrowRight, Eye, Search, Filter, CheckCircle, Clock, XCircle } from "lucide-react"
import type { Transfer, Location } from "../../lib/mock-api"

interface TransferHistoryTableProps {
  transfers: Transfer[]
  locations: Location[]
  onViewTransfer: (transfer: Transfer) => void
}

export function TransferHistoryTable({ transfers, locations, onViewTransfer }: TransferHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date-desc")

  const getLocationName = (id: string) => {
    return locations.find((l) => l.id === id)?.name || id
  }

  const getStatusIcon = (status: Transfer["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
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

  // Filter and sort transfers
  const filteredTransfers = transfers
    .filter((transfer) => {
      const matchesSearch =
        searchQuery === "" ||
        getLocationName(transfer.fromLocation).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getLocationName(transfer.toLocation).toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transfer.createdBy.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === "all" || transfer.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "date-asc":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case "status":
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>История трансферов</CardTitle>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по локациям, ID или пользователю..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="completed">Завершенные</SelectItem>
              <SelectItem value="pending">Ожидающие</SelectItem>
              <SelectItem value="failed">Неудачные</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Сортировка" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Сначала новые</SelectItem>
              <SelectItem value="date-asc">Сначала старые</SelectItem>
              <SelectItem value="status">По статусу</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Товары</TableHead>
                <TableHead>Создал</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer) => {
                const totalQuantity = transfer.items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <TableRow key={transfer.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{transfer.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getLocationName(transfer.fromLocation)}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{getLocationName(transfer.toLocation)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transfer.status)}
                        {getStatusBadge(transfer.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{transfer.items.length} позиций</div>
                        <div className="text-muted-foreground">{totalQuantity} ед.</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{transfer.createdBy}</TableCell>
                    <TableCell className="text-sm">{formatDate(transfer.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => onViewTransfer(transfer)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredTransfers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Трансферы не найдены</p>
              {searchQuery && <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>}
            </div>
          )}
        </div>

        {/* Results summary */}
        {filteredTransfers.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Показано {filteredTransfers.length} из {transfers.length} трансферов
          </div>
        )}
      </CardContent>
    </Card>
  )
}
