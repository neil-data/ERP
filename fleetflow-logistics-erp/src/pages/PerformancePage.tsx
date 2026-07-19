import React, { useEffect, useState } from "react";
import { Award, TrendingUp, Wrench, Activity, Search, Trophy } from "lucide-react";
import { api } from "../services/api";
import { Vehicle } from "../types";
import { Button, StatCard, Skeleton } from "../components/UI";

interface PerformancePageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

interface DriverStat {
  driverName: string;
  licenseNumber: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
}

interface MaintenanceStat {
  _id: string; // vehicle id
  totalMaintenanceCost: number;
  maintenanceCount: number;
}

interface TripStat {
  _id: string; // vehicle id
  totalTrips: number;
}

export const PerformancePage: React.FC<PerformancePageProps> = ({ showToast }) => {
  const [driverStats, setDriverStats] = useState<DriverStat[]>([]);
  const [tripStats, setTripStats] = useState<TripStat[]>([]);
  const [maintenanceStats, setMaintenanceStats] = useState<MaintenanceStat[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPerformanceLogs = async () => {
    setLoading(true);
    try {
      const [driversData, vehiclePerf, vehiclesData] = await Promise.all([
        api.performance.drivers(),
        api.performance.vehicles(),
        api.vehicles.list(),
      ]);
      setDriverStats(driversData);
      setTripStats(vehiclePerf.tripStats || []);
      setMaintenanceStats(vehiclePerf.maintenanceStats || []);
      setVehicles(vehiclesData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve performance data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceLogs();
  }, []);

  const filteredDrivers = driverStats.filter(
    (dp) =>
      dp.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dp.licenseNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTripsAcrossFleet = driverStats.reduce((sum, d) => sum + d.totalTrips, 0);
  const totalCompleted = driverStats.reduce((sum, d) => sum + d.completedTrips, 0);
  const completionRate = totalTripsAcrossFleet > 0 ? Math.round((totalCompleted / totalTripsAcrossFleet) * 100) : 0;
  const totalMaintenanceSpend = maintenanceStats.reduce((sum, m) => sum + m.totalMaintenanceCost, 0);

  const vehicleRegLookup = (vehicleId: string) => vehicles.find((v) => v._id === vehicleId)?.regNumber || "Unknown";

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FLEET PERFORMANCE</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Performance Overview
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchPerformanceLogs} className="font-mono text-xs flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          <span>REFRESH</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Trip Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${totalCompleted} of ${totalTripsAcrossFleet} trips completed`}
          icon={<Award className="w-5 h-5 text-accent" />}
        />
        <StatCard
          title="Drivers Tracked"
          value={driverStats.length}
          subtitle="With trip history"
          icon={<TrendingUp className="w-5 h-5 text-green-400" />}
        />
        <StatCard
          title="Total Maintenance Spend"
          value={`₹${totalMaintenanceSpend.toLocaleString("en-IN")}`}
          subtitle={`Across ${maintenanceStats.length} vehicles`}
          icon={<Wrench className="w-5 h-5 text-accent" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Driver Trip Performance */}
        <div className="lg:col-span-2 bg-card border border-brand-border rounded overflow-hidden flex flex-col">
          <div className="p-4 border-b border-brand-border bg-surface/30 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider">Driver Trip Record</h3>
              <p className="text-[10px] text-secondary-text mt-0.5">Trips completed vs cancelled per driver</p>
            </div>
            <div className="relative max-w-[180px]">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-secondary-text" />
              <input
                type="text"
                placeholder="Search driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-surface border border-brand-border text-[11px] rounded pl-8 pr-2 py-1.5 outline-none focus:border-accent text-primary-text font-sans w-full"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-3 flex-1">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="py-12 text-center text-secondary-text text-xs flex-1">
              No driver trip records yet.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs text-secondary-text">
                <thead>
                  <tr className="border-b border-brand-border bg-surface/10 text-[10px] font-mono uppercase tracking-wider">
                    <th className="py-2.5 px-4">Driver</th>
                    <th className="py-2.5 px-4">Total Trips</th>
                    <th className="py-2.5 px-4">Cancelled</th>
                    <th className="py-2.5 px-4 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/40">
                  {filteredDrivers
                    .sort((a, b) => b.totalTrips - a.totalTrips)
                    .map((item, index) => {
                      const rate = item.totalTrips > 0 ? Math.round((item.completedTrips / item.totalTrips) * 100) : 0;
                      return (
                        <tr key={item.licenseNumber} className="hover:bg-surface/10 transition-colors">
                          <td className="py-3 px-4 text-primary-text font-bold">
                            <div className="flex items-center gap-2">
                              {index < 3 && <Trophy className="w-3.5 h-3.5 text-accent" />}
                              <span>{item.driverName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono">{item.totalTrips}</td>
                          <td className="py-3 px-4 font-mono">{item.cancelledTrips}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${rate >= 80 ? "bg-green-950/20 border border-green-900/40 text-green-400" : "bg-yellow-950/20 border border-yellow-900/40 text-yellow-400"}`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Vehicle Maintenance Cost */}
        <div className="bg-card border border-brand-border rounded overflow-hidden flex flex-col">
          <div className="p-4 border-b border-brand-border bg-surface/30">
            <h3 className="text-xs font-mono font-bold text-primary-text uppercase tracking-wider">Vehicle Maintenance Cost</h3>
            <p className="text-[10px] text-secondary-text mt-0.5">Total service cost per vehicle</p>
          </div>

          {loading ? (
            <div className="p-4 space-y-3 flex-1">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : maintenanceStats.length === 0 ? (
            <div className="py-12 text-center text-secondary-text text-xs flex-1">
              No maintenance records yet.
            </div>
          ) : (
            <div className="p-4 divide-y divide-brand-border/40 space-y-3 overflow-y-auto max-h-[360px] flex-1">
              {maintenanceStats.map((m) => {
                const trips = tripStats.find((t) => t._id === m._id);
                return (
                  <div key={m._id} className="pt-3 first:pt-0 flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-surface border border-brand-border flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-mono font-bold text-primary-text block">{vehicleRegLookup(m._id)}</span>
                        <span className="text-xs font-mono text-accent">₹{m.totalMaintenanceCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-secondary-text/80">
                        <span>Services: <strong className="text-primary-text">{m.maintenanceCount}</strong></span>
                        {trips && <span>Trips: <strong className="text-primary-text">{trips.totalTrips}</strong></span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};