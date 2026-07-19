import React from "react";
import {
  LayoutDashboard,
  Truck,
  Users as DriversIcon,
  MapPin,
  Wrench,
  Receipt,
  ShieldCheck,
  BarChart3,
  UserCog,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { User, UserRole } from "../types";
import { Badge } from "./UI";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  setActiveTab,
  onLogout,
}) => {
  // Navigation mapping according to Role Based Access guidelines
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4.5 h-4.5" />, roles: ["fleet_manager", "dispatcher", "safety_officer", "financial_analyst"] },
    { id: "vehicles", label: "Vehicles", icon: <Truck className="w-4.5 h-4.5" />, roles: ["fleet_manager", "dispatcher"] },
    { id: "drivers", label: "Drivers", icon: <DriversIcon className="w-4.5 h-4.5" />, roles: ["fleet_manager", "dispatcher"] },
    { id: "trips", label: "Trips Dispatch", icon: <MapPin className="w-4.5 h-4.5" />, roles: ["fleet_manager", "dispatcher"] },
    { id: "maintenance", label: "Maintenance", icon: <Wrench className="w-4.5 h-4.5" />, roles: ["fleet_manager", "dispatcher"] },
    { id: "expenses", label: "Expenses", icon: <Receipt className="w-4.5 h-4.5" />, roles: ["fleet_manager", "financial_analyst"] },
    { id: "performance", label: "Performance", icon: <ShieldCheck className="w-4.5 h-4.5" />, roles: ["fleet_manager", "safety_officer"] },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4.5 h-4.5" />, roles: ["fleet_manager", "financial_analyst"] },
    { id: "users", label: "User Management", icon: <UserCog className="w-4.5 h-4.5" />, roles: ["fleet_manager"] },
  ];

  // Filter items visible to current user's role
  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-surface border-r border-brand-border h-screen flex flex-col z-20 shrink-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-brand-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-accent/10 border border-accent/30 flex items-center justify-center text-accent shadow-[0_0_10px_rgba(229,122,58,0.15)]">
            <Truck className="w-4.5 h-4.5" />
          </div>
          <span className="font-display font-bold text-base tracking-wide uppercase text-primary-text">
            Fleet<span className="text-accent font-display">Flow</span>
          </span>
        </div>
        <div className="text-[9px] font-mono border border-brand-border bg-card px-1.5 py-0.5 rounded text-secondary-text">
          v1.4.0
        </div>
      </div>

      {/* User Profile Info Card */}
      <div className="p-4 mx-4 mt-5 mb-2 bg-card/60 border border-brand-border rounded flex flex-col gap-2 relative group overflow-hidden">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-accent/10 border border-brand-border flex items-center justify-center font-bold text-accent font-display text-sm">
            {user.name.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-primary-text truncate font-sans">
              {user.name}
            </span>
            <span className="text-[10px] text-secondary-text truncate font-mono">
              {user.email}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-brand-border/40">
          <Badge status={user.role} />
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-mono text-secondary-text tracking-wider uppercase font-display px-3 mb-2">
          Management Console
        </div>
        {visibleItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2 rounded text-xs font-sans transition-all group ${
                isActive
                  ? "bg-accent/10 text-accent font-medium border border-accent/20"
                  : "text-secondary-text hover:text-primary-text hover:bg-card/50 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-accent" : "text-secondary-text group-hover:text-primary-text"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-accent" />}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-brand-border/60">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2.5 bg-card hover:bg-red-950/20 text-secondary-text hover:text-red-400 border border-brand-border hover:border-red-900/40 rounded py-2 text-xs font-sans transition-all outline-none"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit ERP Console</span>
        </button>
      </div>
    </aside>
  );
};