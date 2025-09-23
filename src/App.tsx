import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "./components/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthGuard } from "./components/auth/auth-guard"
import { LoginPage } from "./pages/LoginPage"
import { DashboardPage } from "./pages/DashboardPage"
import { TransfersPage } from "./pages/TransfersPage"
import { SettingsPage } from "./pages/SettingsPage"
import "./index.css"

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route
            path="/transfers"
            element={
              <AuthGuard>
                <TransfersPage />
              </AuthGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AuthGuard>
                <SettingsPage />
              </AuthGuard>
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
