import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/toaster";
import { AuthGuard } from "./components/auth/auth-guard";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TransfersPage } from "./pages/TransfersPage";
import { SettingsPage } from "./pages/SettingsPage";
import "./index.css";
import AddObjectsPage from "./app/add-objects/page";
import { HistoryPage } from "./app/history/page";

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
            path="/objects"
            element={
              <AuthGuard>
                <SettingsPage />
              </AuthGuard>
            }
          />
          <Route
            path="/add-objects"
            element={
              <AuthGuard>
                <AddObjectsPage />
              </AuthGuard>
            }
          />

          <Route
            path="/history"
            element={
              <AuthGuard>
                <HistoryPage />
              </AuthGuard>
            }
          />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
