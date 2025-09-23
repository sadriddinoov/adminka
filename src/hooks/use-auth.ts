"use client"

import { useState, useEffect } from "react"
import { authService, type AuthState } from "../lib/auth"

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authService.getState())

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState)
    return unsubscribe
  }, [])

  const login = async (username: string, password: string) => {
    return await authService.login(username, password)
  }

  const logout = () => {
    authService.logout()
  }

  return {
    ...authState,
    login,
    logout,
  }
}
