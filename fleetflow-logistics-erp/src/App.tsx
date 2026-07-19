import { useEffect, useState } from "react";
import { api } from "./services/api";
import { User } from "./types";
import { Sidebar } from "./components/Sidebar";
import { ToastContainer, Toast } from "./components/UI";

// Page imports
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { DriversPage } from "./pages/DriversPage";
import { TripsPage } from "./pages/TripsPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { PerformancePage } from "./pages/PerformancePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { UsersPage } from "./pages/UsersPage";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore session
  const restoreSession = async () => {
    setLoading(true);
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      // Not logged in or expired, fallback to login
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      setUser(null);
      showToast("Logged out successfully.", "success");
    } catch {
      showToast("Error logging out.", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 space-y-4 font-mono text-xs text-secondary-text">
        <div className="w-16 h-16 border-b-2 border-accent rounded-full animate-spin" />
        <div className="text-center space-y-1.5">
          <p className="font-bold text-primary-text font-display text-sm tracking-widest">FLEETFLOW</p>
          <p className="animate-pulse">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={(u) => setUser(u)} showToast={showToast} />
        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  // Active view router
  const renderActiveView = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage user={user} showToast={showToast} setActiveTab={setActiveTab} />;
      case "vehicles":
        return <VehiclesPage showToast={showToast} />;
      case "drivers":
        return <DriversPage showToast={showToast} />;
      case "trips":
        return <TripsPage showToast={showToast} />;
      case "maintenance":
        return <MaintenancePage showToast={showToast} />;
      case "expenses":
        return <ExpensesPage user={user} showToast={showToast} />;
      case "performance":
        return <PerformancePage showToast={showToast} />;
      case "analytics":
        return <AnalyticsPage showToast={showToast} />;
      case "users":
        return <UsersPage currentUser={user} showToast={showToast} />;
      default:
        return <DashboardPage user={user} showToast={showToast} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex text-primary-text font-sans selection:bg-accent/20 overflow-hidden">
      {/* Sidebar Navigation Panel */}
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Panel Viewport */}
      <main className="flex-1 h-screen overflow-y-auto px-6 py-6 md:px-10 md:py-8 relative">
        <div className="absolute top-0 left-1/4 right-1/4 h-64 bg-hero-glow z-0 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto space-y-6">
          {renderActiveView()}
        </div>
      </main>

      {/* Feedback Alert Queue */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}