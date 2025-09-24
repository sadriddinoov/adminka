"use client";

import { $api, tokenName } from "../config/api";

export interface User {
  username: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthService {
  private listeners: ((state: AuthState) => void)[] = [];
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeAuth();
    }
  }

  private initializeAuth() {
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
    const userData = localStorage.getItem("userData");

    if (isAuthenticated && userData) {
      try {
        const user = JSON.parse(userData);
        this.state = {
          user,
          isAuthenticated: true,
          isLoading: false,
        };
      } catch {
        this.logout();
      }
    } else {
      this.state.isLoading = false;
    }

    this.notifyListeners();
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.setState({ isLoading: true });

    try {
      // Call /api/login/ to get token
      const loginRes = await $api.post("/api/login/", { username, password });
      const { token } = loginRes.data;

      if (token) {
        // Store token in localStorage and set axios headers
        localStorage.setItem(tokenName, token);
        $api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // Fetch user data from /api/user
        const userRes = await $api.get("/api/user");
        const user: User = userRes.data;

        if (user) {
          localStorage.setItem("isAuthenticated", "true");
          localStorage.setItem("userData", JSON.stringify(user));

          this.setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });

          return { success: true };
        } else {
          this.setState({ isLoading: false });
          return { success: false, error: "Не удалось получить данные пользователя" };
        }
      } else {
        this.setState({ isLoading: false });
        return { success: false, error: "Неверный логин или пароль" };
      }
    } catch (error: any) {
      this.setState({ isLoading: false });
      const errorMessage = error.response?.data?.message || "Ошибка подключения к серверу";
      return { success: false, error: errorMessage };
    }
  }

  logout() {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userData");
    localStorage.removeItem(tokenName);
    delete $api.defaults.headers.common["Authorization"];

    this.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }

  getState(): AuthState {
    return this.state;
  }
}

export const authService = new AuthService();