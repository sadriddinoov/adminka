"use client"

import { mockAPI, type User } from "./mock-api"

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = []
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  }

  constructor() {
    // Initialize auth state from localStorage
    if (typeof window !== "undefined") {
      this.initializeAuth()
    }
  }

  private initializeAuth() {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"
    const userData = localStorage.getItem("userData")

    if (isAuthenticated && userData) {
      try {
        const user = JSON.parse(userData)
        this.state = {
          user,
          isAuthenticated: true,
          isLoading: false,
        }
      } catch {
        this.logout()
      }
    } else {
      this.state.isLoading = false
    }

    this.notifyListeners()
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState }
    this.notifyListeners()
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.setState({ isLoading: true })

    try {
      const user = await mockAPI.login(username, password)

      if (user) {
        localStorage.setItem("isAuthenticated", "true")
        localStorage.setItem("userData", JSON.stringify(user))

        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })

        return { success: true }
      } else {
        this.setState({ isLoading: false })
        return { success: false, error: "Неверный логин или пароль" }
      }
    } catch (error) {
      this.setState({ isLoading: false })
      return { success: false, error: "Ошибка подключения к серверу" }
    }
  }

  logout() {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userData")

    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }

  getState(): AuthState {
    return this.state
  }
}

export const authService = new AuthService()
