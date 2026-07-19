import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Download, Eye, Map, Send, AlertTriangle } from "lucide-react";
import { api } from "../services/api";
import { Trip, Driver, Vehicle } from "../types";
import { Button, Input, Select, Badge, Drawer, Modal, Skeleton } from "../components/UI";

interface TripsPageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const TripsPage: React.FC<TripsPageProps> = ({ showToast }) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortField, setSortField] = useState<"origin" | "scheduledDeparture">("scheduledDeparture");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);

  // Form fields — matches real Trip schema only
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [scheduledDeparture, setScheduledDeparture] = useState("");
  const [actualArrival, setActualArrival] = useState("");
  const [status, setStatus] = useState<Trip["status"]>("scheduled");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchTripsAndAssets = async () => {
    setLoading(true);
    try {
      const [tripsData, driversData, vehiclesData] = await Promise.all([
        api.trips.list(),
        api.drivers.list(),
        api.vehicles.list(),
      ]);
      setTrips(tripsData);
      setDrivers(driversData);
      setVehicles(vehiclesData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve trips", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripsAndAssets();
  }, []);

  const handleSort = (field: "origin" | "scheduledDeparture") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredTrips = trips
    .filter((t) => {
      const matchesSearch =
        t.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.driver?.name && t.driver.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.vehicle?.regNumber && t.vehicle.regNumber.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "origin") {
        return sortOrder === "asc" ? a.origin.localeCompare(b.origin) : b.origin.localeCompare(a.origin);
      }
      const valA = new Date(a.scheduledDeparture).getTime();
      const valB = new Date(b.scheduledDeparture).getTime();
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });

  const handleOpenCreate = () => {
    setFormMode("create");
    setVehicleId("");
    setDriverId("");
    setOrigin("");
    setDestination("");
    setScheduledDeparture("");
    setActualArrival("");
    setStatus("scheduled");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (t: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setSelectedTrip(t);
    setVehicleId(t.vehicle?._id || "");
    setDriverId(t.driver?._id || "");
    setOrigin(t.origin);
    setDestination(t.destination);
    setScheduledDeparture(t.scheduledDeparture ? t.scheduledDeparture.slice(0, 16) : "");
    setActualArrival(t.actualArrival ? t.actualArrival.slice(0, 16) : "");
    setStatus(t.status);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (t: Trip) => {
    setSelectedTrip(t);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (t: Trip, e: React.MouseEvent) => {
    e.stopPropagation();
    setTripToDelete(t);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId || !origin || !destination || !scheduledDeparture) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setSubmitLoading(true);
    const payload: any = {
      vehicle: vehicleId,
      driver: driverId,
      origin,
      destination,
      scheduledDeparture: new Date(scheduledDeparture).toISOString(),
      status,
    };
    if (actualArrival) payload.actualArrival = new Date(actualArrival).toISOString();

    try {
      if (formMode === "create") {
        await api.trips.create(payload);
        showToast("Trip dispatched successfully.", "success");
      } else if (formMode === "edit" && selectedTrip) {
        await api.trips.update(selectedTrip._id, payload);
        showToast("Trip updated successfully.", "success");
      }
      setIsFormOpen(false);
      fetchTripsAndAssets();
    } catch (err: any) {
      showToast(err.message || "Failed to save trip", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!tripToDelete) return;
    try {
      await api.trips.delete(tripToDelete._id);
      showToast("Trip deleted.", "success");
      setIsDeleteOpen(false);
      setTripToDelete(null);
      fetchTripsAndAssets();
    } catch (err: any) {
      showToast(err.message || "Failed to delete trip", "error");
    }
  };

  const handleExportCSV = () => {
    if (trips.length === 0) {
      showToast("No trips available to export.", "warning");
      return;
    }
    const headers = "ID,Vehicle,Driver,Origin,Destination,Scheduled Departure,Status\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      trips
        .map(
          (t) =>
            `"${t._id}","${t.vehicle?.regNumber}","${t.driver?.name}","${t.origin}","${t.destination}","${t.scheduledDeparture}","${t.status}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FleetFlow_Trips.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export complete.", "success");
  };

  // Eligible = active/available, but always include the currently-assigned one when editing
  const eligibleVehicles = vehicles.filter((v) => v.status === "active" || (formMode === "edit" && v._id === vehicleId));
  const eligibleDrivers = drivers.filter((d) => d.status === "available" || (formMode === "edit" && d._id === driverId));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">DISPATCH QUEUE</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Trip Dispatcher
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="font-mono text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span>DISPATCH TRIP</span>
          </Button>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-xs shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-text">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search routes, drivers, vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-brand-border rounded pl-9 pr-3 py-2 text-xs outline-none focus:border-accent/60 text-primary-text font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full justify-end">
          <Filter className="w-3.5 h-3.5 text-secondary-text shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
          >
            <option value="all">All Trips</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="py-16 text-center text-secondary-text flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded bg-surface border border-brand-border/60 flex items-center justify-center text-secondary-text">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text">No Trips Found</p>
              <p className="text-xs text-secondary-text/70 mt-1 max-w-sm">
                No trips match your filters, or none exist yet.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs">
              Dispatch First Trip
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th onClick={() => handleSort("origin")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Route {sortField === "origin" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Vehicle / Driver</th>
                  <th onClick={() => handleSort("scheduledDeparture")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Scheduled Departure {sortField === "scheduledDeparture" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredTrips.map((trip) => (
                  <tr
                    key={trip._id}
                    onClick={() => handleOpenDetail(trip)}
                    className="hover:bg-surface/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="text-primary-text font-medium">{trip.origin}</span>
                        <span className="text-accent">➔</span>
                        <span className="text-primary-text font-medium">{trip.destination}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <div className="flex flex-col">
                        <span className="text-primary-text font-medium">{trip.vehicle?.regNumber}</span>
                        <span className="text-[10px] text-secondary-text">{trip.driver?.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{new Date(trip.scheduledDeparture).toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={trip.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(trip); }} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-primary-text transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(trip, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenDelete(trip, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER */}
      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Trip Details">
        {selectedTrip && (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-4 border-b border-brand-border/60 pb-5">
              <div className="w-12 h-12 rounded bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">TRIP</span>
                <h3 className="text-lg font-bold font-display text-primary-text tracking-tight">{selectedTrip.origin} ➔ {selectedTrip.destination}</h3>
              </div>
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-3">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-accent" />
                <span>Route</span>
              </div>
              <div className="flex flex-col gap-3.5 pl-2 relative">
                <div className="absolute left-3.5 top-2.5 bottom-2.5 w-0.5 bg-brand-border" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-accent border border-card" />
                  <div className="text-xs">
                    <span className="text-secondary-text block text-[9px] font-mono">ORIGIN</span>
                    <span className="text-primary-text font-bold text-sm">{selectedTrip.origin}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-card" />
                  <div className="text-xs">
                    <span className="text-secondary-text block text-[9px] font-mono">DESTINATION</span>
                    <span className="text-primary-text font-bold text-sm">{selectedTrip.destination}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Vehicle</span>
                <span className="text-xs font-mono font-semibold text-primary-text block mt-1">{selectedTrip.vehicle?.regNumber}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Driver</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 truncate">{selectedTrip.driver?.name}</span>
              </div>
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-3">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2">Timing</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Scheduled Departure</span>
                <span className="font-mono text-primary-text font-bold">{new Date(selectedTrip.scheduledDeparture).toLocaleString("en-IN")}</span>
              </div>
              {selectedTrip.actualArrival && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary-text">Actual Arrival</span>
                  <span className="font-mono text-primary-text font-bold">{new Date(selectedTrip.actualArrival).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Status</span>
                <Badge status={selectedTrip.status} />
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-brand-border/60 pt-5">
              <Button variant="secondary" className="flex-1 text-xs uppercase" onClick={(e) => handleOpenEdit(selectedTrip, e)}>
                Edit Trip
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === "create" ? "Dispatch Trip" : "Edit Trip"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="bg-surface border border-brand-border rounded text-sm px-3 py-2 text-primary-text outline-none focus:border-accent"
                required
              >
                <option value="">-- Select Vehicle --</option>
                {eligibleVehicles.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.regNumber} ({v.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="bg-surface border border-brand-border rounded text-sm px-3 py-2 text-primary-text outline-none focus:border-accent"
                required
              >
                <option value="">-- Select Driver --</option>
                {eligibleDrivers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Origin"
              placeholder="E.g. Ahmedabad"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              required
            />
            <Input
              label="Destination"
              placeholder="E.g. Surat"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Scheduled Departure"
              type="datetime-local"
              value={scheduledDeparture}
              onChange={(e) => setScheduledDeparture(e.target.value)}
              required
            />
            <Input
              label="Actual Arrival (optional)"
              type="datetime-local"
              value={actualArrival}
              onChange={(e) => setActualArrival(e.target.value)}
            />
          </div>

          <Select
            label="Status"
            options={[
              { value: "scheduled", label: "Scheduled" },
              { value: "in_progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
          />

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save Trip
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Trip">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete trip <span className="font-mono text-primary-text font-bold">{tripToDelete?.origin} ➔ {tripToDelete?.destination}</span>. Linked expenses may become orphaned. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete Trip
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};