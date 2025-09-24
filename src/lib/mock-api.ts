// Mock API service for development
import mockData from "../scripts/mock-data.json"
import { notificationService } from "./notifications"

export interface Item {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface Location {
  id: string;
  name: string;
  address: string;
  created_at: string;
  items: { id: string; name: string; quantity: number; unit: string }[];
}
export interface Transfer {
  id: string;
  fromLocation: string;
  toLocation: string;
  items: TransferItem[];
  createdAt: string;
  status: "completed" | "pending" | "failed";
  error?: string | null;
}
export interface TransferItem {
  itemId: string;
  quantity: number;
}

export interface User {
  id: string
  username: string
  password: string
  role: string
  name: string
}

// Simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

class MockAPI {
  private data = mockData

  async login(username: string, password: string): Promise<User | null> {
    await delay(500)
    const user = this.data.users.find((u) => u.username === username && u.password === password)
    return user || null
  }

  async getLocations(): Promise<Location[]> {
    await delay(300)
    return this.data.locations
  }

  async getLocation(id: string): Promise<Location | null> {
    await delay(200)
    return this.data.locations.find((l) => l.id === id) || null
  }

  async getTransfers(): Promise<Transfer[]> {
    await delay(300)
    return this.data.transfers
  }

  async createTransfer(transfer: Omit<Transfer, "id" | "createdAt" | "status">): Promise<Transfer> {
    await delay(500)

    // Validate transfer
    const fromLocation = this.data.locations.find((l) => l.id === transfer.fromLocation)
    if (!fromLocation) {
      throw new Error("Исходная локация не найдена")
    }

    // Check if items are available
    for (const transferItem of transfer.items) {
      const item = fromLocation.items.find((i) => i.id === transferItem.itemId)
      if (!item || item.quantity < transferItem.quantity) {
        notificationService.addNotification({
          type: "error",
          title: "Ошибка трансфера",
          message: `Недостаточно товара: ${item?.name || transferItem.itemId}`,
        })
        throw new Error(`Недостаточно товара: ${item?.name || transferItem.itemId}`)
      }
    }

    const newTransfer: Transfer = {
      ...transfer,
      id: `transfer-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "completed",
      completedAt: new Date().toISOString(),
    }

    // Update quantities
    const toLocation = this.data.locations.find((l) => l.id === transfer.toLocation)
    if (toLocation) {
      for (const transferItem of transfer.items) {
        // Remove from source
        const fromItem = fromLocation.items.find((i) => i.id === transferItem.itemId)
        if (fromItem) {
          fromItem.quantity -= transferItem.quantity
        }

        // Add to destination
        const toItem = toLocation.items.find((i) => i.id === transferItem.itemId)
        if (toItem) {
          toItem.quantity += transferItem.quantity
        } else {
          const sourceItem = fromLocation.items.find((i) => i.id === transferItem.itemId)
          if (sourceItem) {
            toLocation.items.push({
              ...sourceItem,
              quantity: transferItem.quantity,
            })
          }
        }
      }
    }

    this.data.transfers.unshift(newTransfer)

    const fromLocationName = this.data.locations.find((l) => l.id === transfer.fromLocation)?.name
    const toLocationName = this.data.locations.find((l) => l.id === transfer.toLocation)?.name

    notificationService.addNotification({
      type: "success",
      title: "Трансфер выполнен",
      message: `Товары успешно перемещены из ${fromLocationName} в ${toLocationName}`,
    })

    return newTransfer
  }
}

export const mockAPI = new MockAPI()
