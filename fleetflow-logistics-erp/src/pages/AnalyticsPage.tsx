import React, { useEffect, useState } from "react";
import { TrendingUp, IndianRupee, PieChart as PieIcon, BarChart3, RefreshCw, Truck } from "lucide-react";
import { api } from "../services/api";
import { Vehicle, Driver } from "../types";
import { Button, Skeleton } from "../components/UI";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsPageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

const COLORS = ["#f97316", "#10b981", "#3b82f6", "#eab308", "#ef4444", "#a855f7"];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ showToast }) => {
  const [expenseStats, setExpenseStats] = useState<{ byCategory: any[]; totalSpent: number } | null>(null);
  const [fleetStats, setFleetStats] = useState<{ byStatus: any[]; byType: any[] } | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [expenseData, fleetData, vehiclesData, driversData] = await Promise.all([
        api.analytics.expenses(),
        api.analytics.fleet(),
        api.vehicles.list(),
        api.drivers.list(),
      ]);
      setExpenseStats(expenseData);
      setFleetStats(fleetData);
      setVehicles(vehiclesData);
      setDrivers(driversData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const totalSpentSum = expenseStats?.totalSpent || 0;
  const pieData = expenseStats?.byCategory?.map((c: any) => ({ name: c._id, value: c.total })) || [];

  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const onTripDrivers = drivers.filter((d) => d.status === "on_trip").length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FINANCIAL INTELLIGENCE</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Analytics
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchAnalytics} className="font-mono text-xs flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>REFRESH</span>
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Expense by category - bar */}
            <div className="lg:col-span-2 bg-card border border-brand-border rounded p-4">
              <div className="flex items-center justify-between border-b border-brand-border pb-3 mb-4">
                <div>
                  <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <span>Expense Breakdown by Category</span>
                  </h3>
                  <p className="text-[10px] text-secondary-text mt-0.5">All logged expenses, grouped by type</p>
                </div>
                <div className="text-xs font-mono text-primary-text font-bold">
                  Total: ₹{totalSpentSum.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="h-72 w-full">
                {pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-secondary-text">
                    No expenses logged yet.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseStats?.byCategory || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                      <XAxis dataKey="_id" stroke="#737373" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                      <YAxis stroke="#737373" style={{ fontSize: "10px", fontFamily: "monospace" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#171717", borderColor: "#404040", borderRadius: "4px" }}
                        itemStyle={{ color: "#f5f5f5", fontSize: "11px", fontFamily: "monospace" }}
                        labelStyle={{ color: "#a3a3a3", fontSize: "11px", fontFamily: "monospace" }}
                      />
                      <Bar dataKey="total" fill="#f97316" radius={[4, 4, 0, 0]} name="Amount (₹)" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Pie chart */}
            <div className="bg-card border border-brand-border rounded p-4 flex flex-col">
              <div className="border-b border-brand-border pb-3 mb-4">
                <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-accent" />
                  <span>Category Distribution</span>
                </h3>
                <p className="text-[10px] text-secondary-text mt-0.5">Proportional spend by category</p>
              </div>

              {pieData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-secondary-text">
                  No expense categories logged.
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="h-52 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                          {pieData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#171717", borderColor: "#404040" }} itemStyle={{ color: "#fff", fontSize: "11px", fontFamily: "monospace" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono text-secondary-text w-full px-2 mt-2">
                    {pieData.map((item: any, idx: number) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate capitalize">{item.name}: <strong>₹{(item.value / 1000).toFixed(1)}k</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Fleet composition */}
            <div className="md:col-span-2 bg-card border border-brand-border rounded p-4">
              <div className="border-b border-brand-border pb-3 mb-4">
                <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-accent" />
                  <span>Fleet Composition</span>
                </h3>
                <p className="text-[10px] text-secondary-text mt-0.5">Vehicles grouped by status and type</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fleetStats?.byType || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="_id" stroke="#737373" style={{ fontSize: "10px", fontFamily: "monospace" }} />
                    <YAxis stroke="#737373" style={{ fontSize: "10px", fontFamily: "monospace" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#171717", borderColor: "#404040" }} itemStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                    <Bar dataKey="count" name="Vehicles" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Utilization ratios */}
            <div className="bg-card border border-brand-border rounded p-4 flex flex-col justify-between">
              <div>
                <div className="border-b border-brand-border pb-3 mb-4">
                  <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider">Utilization</h3>
                  <p className="text-[10px] text-secondary-text mt-0.5">Live fleet & personnel allocation</p>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-secondary-text text-[10px]">
                      <span>Active Vehicles</span>
                      <span className="text-primary-text font-bold">{activeVehicles} / {vehicles.length}</span>
                    </div>
                    <div className="w-full bg-surface border border-brand-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-accent h-full transition-all duration-500"
                        style={{ width: `${vehicles.length > 0 ? (activeVehicles / vehicles.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-secondary-text text-[10px]">
                      <span>Drivers On Trip</span>
                      <span className="text-primary-text font-bold">{onTripDrivers} / {drivers.length}</span>
                    </div>
                    <div className="w-full bg-surface border border-brand-border rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-green-400 h-full transition-all duration-500"
                        style={{ width: `${drivers.length > 0 ? (onTripDrivers / drivers.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};