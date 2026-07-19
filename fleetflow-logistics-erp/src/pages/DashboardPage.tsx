import React, { useEffect, useState } from "react";
import {
  Truck,
  Users as DriversIcon,
  MapPin,
  Wrench,
  Receipt,
  ShieldCheck,
  TrendingUp,
  IndianRupee,
  Activity,
  AlertTriangle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { api } from "../services/api";
import { User, Trip, Driver, Vehicle, Expense } from "../types";
import { StatCard, Skeleton, Badge, Button } from "../components/UI";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardPageProps {
  user: User;
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, showToast, setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [fleetStats, setFleetStats] = useState<{ byStatus: any[]; byType: any[] } | null>(null);
  const [expenseStats, setExpenseStats] = useState<{ byCategory: any[]; totalSpent: number } | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [driverPerf, setDriverPerf] = useState<any[]>([]);
  const [vehiclePerf, setVehiclePerf] = useState<{ tripStats: any[]; maintenanceStats: any[] } | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const calls: Promise<any>[] = [
        api.trips.list(),
        api.drivers.list(),
        api.vehicles.list(),
      ];

      // Fetch role-relevant data only — avoids 403s for sections a role can't access
      if (user.role === "fleet_manager") {
        calls.push(api.analytics.fleet(), api.analytics.expenses(), api.expenses.list());
      } else if (user.role === "financial_analyst") {
        calls.push(api.analytics.expenses(), api.expenses.list());
      } else if (user.role === "safety_officer") {
        calls.push(api.performance.drivers(), api.performance.vehicles());
      }

      const results = await Promise.all(calls);

      setTrips(results[0]);
      setDrivers(results[1]);
      setVehicles(results[2]);

      if (user.role === "fleet_manager") {
        setFleetStats(results[3]);
        setExpenseStats(results[4]);
        setExpenses(results[5]);
      } else if (user.role === "financial_analyst") {
        setExpenseStats(results[3]);
        setExpenses(results[4]);
      } else if (user.role === "safety_officer") {
        setDriverPerf(results[3]);
        setVehiclePerf(results[4]);
      }
    } catch (err: any) {
      showToast(err.message || "Error retrieving dashboard data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user.role]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const chartCardStyle = "bg-card border border-brand-border rounded p-5 relative overflow-hidden";
  const colors = ["#E57A3A", "#22C55E", "#F59E0B", "#EF4444", "#3B82F6"];

  // Derived real counts (no fabricated aggregates)
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const availableDrivers = drivers.filter((d) => d.status === "available").length;
  const activeTrips = trips.filter((t) => t.status === "in_progress").length;
  const scheduledTrips = trips.filter((t) => t.status === "scheduled").length;
  const inTransitTrips = trips.filter((t) => t.status === "in_progress").length;
  const heavyAvailable = vehicles.filter((v) => v.status === "active" && v.type === "truck").length;
  const pendingExpenses = expenses.filter((e) => !e.approvedBy);
  const pendingTotal = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">
            LOGISTICS TELEMETRY CENTER
          </span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            System Dashboard
          </h1>
          <p className="text-xs text-secondary-text mt-1">
            Welcome back, {user.name}.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchDashboardData} className="font-mono text-xs">
          REFRESH DATA
        </Button>
      </div>

      {/* 1. FLEET MANAGER VIEW */}
      {user.role === "fleet_manager" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Fleet"
              value={`${activeVehicles} / ${vehicles.length}`}
              icon={<Truck className="w-5 h-5 text-accent" />}
              subtitle="Vehicles currently active"
            />
            <StatCard
              title="Driver Availability"
              value={`${availableDrivers} / ${drivers.length}`}
              icon={<DriversIcon className="w-5 h-5 text-accent" />}
              subtitle="Drivers in available pool"
            />
            <StatCard
              title="Trips In Progress"
              value={activeTrips}
              icon={<MapPin className="w-5 h-5 text-accent" />}
              subtitle={`${scheduledTrips} scheduled`}
            />
            <StatCard
              title="Total Approved Spend"
              value={`₹${(expenseStats?.totalSpent || 0).toLocaleString("en-IN")}`}
              icon={<IndianRupee className="w-5 h-5 text-accent" />}
              subtitle="Sum of all logged expenses"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${chartCardStyle} lg:col-span-2`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display flex items-center gap-2">
                <Truck className="w-4 h-4 text-accent" />
                <span>Fleet Composition by Status</span>
              </h3>
              <div className="h-64 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fleetStats?.byStatus}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2F" />
                    <XAxis dataKey="_id" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1B1B1F", borderColor: "#2A2A2F", color: "#F5F5F5" }} />
                    <Bar dataKey="count" fill="#E57A3A" name="Vehicles" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={chartCardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" />
                <span>Expense Breakdown</span>
              </h3>
              <div className="h-48 text-xs relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseStats?.byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="total"
                      nameKey="_id"
                    >
                      {expenseStats?.byCategory.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1B1B1F", borderColor: "#2A2A2F" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-t border-brand-border/50 pt-3">
                {expenseStats?.byCategory.map((entry: any, index: number) => (
                  <div key={entry._id} className="flex items-center gap-1.5 text-secondary-text">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="truncate">{entry._id}: ₹{entry.total.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-card border border-brand-border rounded p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text font-display flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span>Recent Trips</span>
                </h3>
                <button onClick={() => setActiveTab("trips")} className="text-accent hover:text-accent-hover text-xs font-mono flex items-center gap-1">
                  <span>Manage</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {trips.length === 0 ? (
                <div className="text-center py-8 border border-brand-border/60 border-dashed rounded text-secondary-text text-xs">
                  No trips logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-secondary-text">
                    <thead>
                      <tr className="border-b border-brand-border text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                        <th className="py-2.5">Route</th>
                        <th className="py-2.5">Vehicle / Driver</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border/40">
                      {trips.slice(0, 5).map((trip) => (
                        <tr key={trip._id} className="hover:bg-surface/30">
                          <td className="py-3 font-sans">
                            <span className="text-primary-text font-medium">{trip.origin}</span>
                            <span className="text-secondary-text/60 mx-1.5">➔</span>
                            <span className="text-primary-text font-medium">{trip.destination}</span>
                          </td>
                          <td className="py-3 font-sans">
                            <div className="flex flex-col">
                              <span className="text-primary-text text-xs">{trip.vehicle?.regNumber}</span>
                              <span className="text-[10px] text-secondary-text">{trip.driver?.name}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge status={trip.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-card border border-brand-border rounded p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display">
                Quick Operations
              </h3>
              <div className="space-y-2.5">
                <button onClick={() => setActiveTab("trips")} className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface/80 border border-brand-border hover:border-accent/30 rounded text-xs transition-all text-left outline-none">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-accent" />
                    <div>
                      <div className="font-medium text-primary-text">Dispatch New Trip</div>
                      <div className="text-[10px] text-secondary-text">Assign drivers & assets</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-secondary-text" />
                </button>
                <button onClick={() => setActiveTab("maintenance")} className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface/80 border border-brand-border hover:border-accent/30 rounded text-xs transition-all text-left outline-none">
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-4 h-4 text-accent" />
                    <div>
                      <div className="font-medium text-primary-text">Schedule Maintenance</div>
                      <div className="text-[10px] text-secondary-text">Keep vehicles in service</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-secondary-text" />
                </button>
                <button onClick={() => setActiveTab("expenses")} className="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface/80 border border-brand-border hover:border-accent/30 rounded text-xs transition-all text-left outline-none">
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-accent" />
                    <div>
                      <div className="font-medium text-primary-text">Review Expenses</div>
                      <div className="text-[10px] text-secondary-text">{pendingExpenses.length} awaiting approval</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-secondary-text" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 2. DISPATCHER VIEW */}
      {user.role === "dispatcher" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Scheduled Trips"
              value={scheduledTrips}
              icon={<MapPin className="w-5 h-5 text-accent" />}
              subtitle="Pending departure"
            />
            <StatCard
              title="Trips In Progress"
              value={inTransitTrips}
              icon={<Truck className="w-5 h-5 text-accent" />}
              subtitle="Currently on route"
            />
            <StatCard
              title="Available Trucks"
              value={heavyAvailable}
              icon={<Wrench className="w-5 h-5 text-accent" />}
              subtitle="Ready for dispatch"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${chartCardStyle} lg:col-span-2`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text font-display flex items-center gap-2">
                  <Activity className="w-4 h-4 text-accent" />
                  <span>Active Dispatches</span>
                </h3>
                <Button size="sm" onClick={() => setActiveTab("trips")} className="text-xs">
                  Manage Trips
                </Button>
              </div>

              <div className="space-y-3.5">
                {trips.length === 0 ? (
                  <div className="text-center py-8 border border-brand-border/60 border-dashed rounded text-secondary-text text-xs">
                    No trips logged. Schedule one in the Trips module.
                  </div>
                ) : (
                  trips.slice(0, 6).map((trip) => (
                    <div key={trip._id} className="bg-surface border border-brand-border p-4 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-accent/5 border border-brand-border flex items-center justify-center text-accent">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <Badge status={trip.status} />
                          <div className="text-xs text-primary-text mt-1">
                            {trip.origin} ➔ {trip.destination}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs font-sans text-secondary-text">
                        <div>
                          <span className="text-[10px] font-mono text-secondary-text/80 uppercase block">Vehicle</span>
                          <span className="font-medium text-primary-text">{trip.vehicle?.regNumber}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-secondary-text/80 uppercase block">Driver</span>
                          <span className="font-medium text-primary-text">{trip.driver?.name}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className={chartCardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display">
                Operational Alerts
              </h3>
              <div className="space-y-3 font-sans">
                {vehicles.filter((v) => v.status === "under_maintenance").map((v) => (
                  <div key={v._id} className="p-3.5 bg-yellow-950/20 border border-yellow-900/30 rounded flex items-start gap-3 text-xs text-yellow-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-primary-text font-mono">{v.regNumber}</span>
                      <p className="text-[11px] text-secondary-text mt-1">Under maintenance — unavailable for dispatch.</p>
                    </div>
                  </div>
                ))}
                {drivers.filter((d) => d.status === "off_duty").map((d) => (
                  <div key={d._id} className="p-3.5 bg-surface border border-brand-border rounded flex items-start gap-3 text-xs text-secondary-text">
                    <Clock className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
                    <div>
                      <span className="font-bold text-primary-text">{d.name}</span>
                      <p className="text-[11px] text-secondary-text/70 mt-1">Off duty — excluded from dispatch pool.</p>
                    </div>
                  </div>
                ))}
                {vehicles.filter((v) => v.status === "under_maintenance").length === 0 &&
                  drivers.filter((d) => d.status === "off_duty").length === 0 && (
                    <p className="text-xs text-secondary-text text-center py-6">No active alerts.</p>
                  )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3. SAFETY OFFICER VIEW */}
      {user.role === "safety_officer" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Active Fleet"
              value={`${activeVehicles} / ${vehicles.length}`}
              icon={<Truck className="w-5 h-5 text-accent" />}
              subtitle="Vehicles operational"
            />
            <StatCard
              title="Drivers Tracked"
              value={driverPerf.length}
              icon={<DriversIcon className="w-5 h-5 text-accent" />}
              subtitle="With trip history"
            />
            <StatCard
              title="Vehicles Under Maintenance"
              value={vehicles.filter((v) => v.status === "under_maintenance").length}
              icon={<AlertTriangle className="w-5 h-5 text-accent" />}
              subtitle="Currently out of service"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={chartCardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display flex items-center gap-2">
                <DriversIcon className="w-4.5 h-4.5 text-accent" />
                <span>Driver Trip Record</span>
              </h3>
              <div className="space-y-4">
                {driverPerf.length === 0 && (
                  <p className="text-xs text-secondary-text text-center py-6">No trip data yet.</p>
                )}
                {driverPerf.map((d: any) => {
                  const completionRate = d.totalTrips > 0 ? Math.round((d.completedTrips / d.totalTrips) * 100) : 0;
                  return (
                    <div key={d.licenseNumber} className="flex flex-col gap-1.5 border-b border-brand-border/40 pb-3 last:border-0 last:pb-0 font-sans">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-primary-text block">{d.driverName}</span>
                          <span className="text-[10px] text-secondary-text font-mono">{d.totalTrips} total trips, {d.cancelledTrips} cancelled</span>
                        </div>
                        <span className={`font-mono font-bold py-0.5 px-2 rounded ${completionRate >= 80 ? "text-green-400 bg-green-950/20" : "text-yellow-400 bg-yellow-950/20"}`}>
                          {completionRate}% completed
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${completionRate >= 80 ? "bg-green-500" : "bg-yellow-500"}`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={chartCardStyle}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display flex items-center gap-2">
                <Wrench className="w-4.5 h-4.5 text-accent" />
                <span>Vehicle Maintenance Cost</span>
              </h3>
              <div className="space-y-4 font-sans">
                {vehiclePerf?.maintenanceStats.length === 0 && (
                  <p className="text-xs text-secondary-text text-center py-6">No maintenance records yet.</p>
                )}
                {vehiclePerf?.maintenanceStats.map((m: any) => {
                  const vehicle = vehicles.find((v) => v._id === m._id);
                  return (
                    <div key={m._id} className="flex items-center justify-between border-b border-brand-border/40 pb-3 last:border-0 last:pb-0 text-xs">
                      <div>
                        <span className="font-bold text-primary-text font-mono">{vehicle?.regNumber || "Unknown"}</span>
                        <p className="text-[10px] text-secondary-text mt-0.5">{m.maintenanceCount} service records</p>
                      </div>
                      <span className="font-mono text-secondary-text">₹{m.totalMaintenanceCost.toLocaleString("en-IN")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. FINANCIAL ANALYST VIEW */}
      {user.role === "financial_analyst" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Spend"
              value={`₹${(expenseStats?.totalSpent || 0).toLocaleString("en-IN")}`}
              icon={<IndianRupee className="w-5 h-5 text-accent" />}
              subtitle="Sum of all logged expenses"
            />
            <StatCard
              title="Pending Approvals"
              value={`₹${pendingTotal.toLocaleString("en-IN")}`}
              icon={<Clock className="w-5 h-5 text-accent" />}
              subtitle={`${pendingExpenses.length} filings awaiting review`}
            />
            <StatCard
              title="Total Trips"
              value={trips.length}
              icon={<TrendingUp className="w-5 h-5 text-accent" />}
              subtitle="Across all vehicles"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
            <div className={`${chartCardStyle} lg:col-span-2`}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text mb-4 font-display flex items-center gap-2">
                <Receipt className="w-4 h-4 text-accent" />
                <span>Expense Breakdown by Category</span>
              </h3>
              <div className="h-64 text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseStats?.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2F" />
                    <XAxis dataKey="_id" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip contentStyle={{ backgroundColor: "#1B1B1F", borderColor: "#2A2A2F", color: "#F5F5F5" }} />
                    <Bar dataKey="total" fill="#E57A3A" name="Amount (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={chartCardStyle}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary-text font-display">
                  Pending Approvals
                </h3>
                <Button size="sm" onClick={() => setActiveTab("expenses")} className="text-xs font-mono">
                  Review
                </Button>
              </div>

              <div className="space-y-3">
                {pendingExpenses.length === 0 && (
                  <p className="text-xs text-secondary-text text-center py-6">Nothing pending.</p>
                )}
                {pendingExpenses.slice(0, 4).map((e) => (
                  <div key={e._id} className="p-3.5 bg-surface border border-brand-border rounded">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-text capitalize">{e.category}</span>
                      <Badge status="pending" />
                    </div>
                    <div className="text-xs text-primary-text mt-2">
                      ₹{e.amount.toLocaleString("en-IN")}
                    </div>
                    <p className="text-[10px] text-secondary-text mt-1.5">Submitted by {e.addedBy?.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};