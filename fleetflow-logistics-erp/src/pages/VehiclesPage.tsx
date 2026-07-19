import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Download, Eye, Truck, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { Vehicle, Driver } from "../types";
import { Button, Input, Select, Badge, Drawer, Modal, Skeleton } from "../components/UI";

interface VehiclesPageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({ showToast }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortField, setSortField] = useState<"regNumber" | "capacityKg">("regNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);

  // Form fields — matches real Vehicle schema only
  const [regNumber, setRegNumber] = useState("");
  const [type, setType] = useState<"truck" | "van" | "car" | "bike">("truck");
  const [capacityKg, setCapacityKg] = useState("");
  const [status, setStatus] = useState<"active" | "under_maintenance" | "inactive">("active");
  const [assignedDriver, setAssignedDriver] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehicleData, driverData] = await Promise.all([api.vehicles.list(), api.drivers.list()]);
      setVehicles(vehicleData);
      setDrivers(driverData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve vehicle registry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (field: "regNumber" | "capacityKg") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredVehicles = vehicles
    .filter((v) => {
      const matchesSearch = v.regNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || v.type === typeFilter;
      const matchesStatus = statusFilter === "all" || v.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });

  const handleOpenCreate = () => {
    setFormMode("create");
    setRegNumber("");
    setType("truck");
    setCapacityKg("");
    setStatus("active");
    setAssignedDriver("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setSelectedVehicle(v);
    setRegNumber(v.regNumber);
    setType(v.type);
    setCapacityKg(String(v.capacityKg));
    setStatus(v.status);
    setAssignedDriver(v.assignedDriver?._id || "");
    setIsFormOpen(true);
  };

  const handleOpenDetail = (v: Vehicle) => {
    setSelectedVehicle(v);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (v: Vehicle, e: React.MouseEvent) => {
    e.stopPropagation();
    setVehicleToDelete(v);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || !capacityKg) {
      showToast("Registration number and capacity are required.", "warning");
      return;
    }

    setSubmitLoading(true);
    const payload: any = {
      regNumber,
      type,
      capacityKg: Number(capacityKg),
      status,
    };
    if (assignedDriver) payload.assignedDriver = assignedDriver;

    try {
      if (formMode === "create") {
        await api.vehicles.create(payload);
        showToast("Vehicle registered successfully.", "success");
      } else if (formMode === "edit" && selectedVehicle) {
        await api.vehicles.update(selectedVehicle._id, payload);
        showToast("Vehicle updated successfully.", "success");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to save vehicle", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!vehicleToDelete) return;
    try {
      await api.vehicles.delete(vehicleToDelete._id);
      showToast("Vehicle deleted.", "success");
      setIsDeleteOpen(false);
      setVehicleToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast(err.message || "Failed to delete vehicle", "error");
    }
  };

  const handleExportCSV = () => {
    if (vehicles.length === 0) {
      showToast("No records available to export.", "warning");
      return;
    }
    const headers = "ID,Registration Number,Type,Capacity (kg),Status,Assigned Driver\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      vehicles
        .map(
          (v) =>
            `"${v._id}","${v.regNumber}","${v.type}",${v.capacityKg},"${v.status}","${v.assignedDriver?.name || "Unassigned"}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FleetFlow_Vehicles_Registry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export complete.", "success");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FLEET ASSETS</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Vehicle Registry
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="font-mono text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span>ADD VEHICLE</span>
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
            placeholder="Search registration number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-brand-border rounded pl-9 pr-3 py-2 text-xs outline-none focus:border-accent/60 text-primary-text font-sans"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-secondary-text shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
            >
              <option value="all">All Types</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="car">Car</option>
              <option value="bike">Bike</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_maintenance">Under Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="py-16 text-center text-secondary-text flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded bg-surface border border-brand-border/60 flex items-center justify-center text-secondary-text">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text">No Vehicles Found</p>
              <p className="text-xs text-secondary-text/70 mt-1 max-w-sm">
                No vehicles match these filters, or none exist yet.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs">
              Add First Vehicle
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th onClick={() => handleSort("regNumber")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Reg. Number {sortField === "regNumber" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Type</th>
                  <th onClick={() => handleSort("capacityKg")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Capacity {sortField === "capacityKg" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Assigned Driver</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredVehicles.map((vehicle) => (
                  <tr
                    key={vehicle._id}
                    onClick={() => handleOpenDetail(vehicle)}
                    className="hover:bg-surface/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-text">{vehicle.regNumber}</td>
                    <td className="py-3.5 px-4 capitalize">{vehicle.type}</td>
                    <td className="py-3.5 px-4 text-primary-text">{vehicle.capacityKg.toLocaleString("en-IN")} kg</td>
                    <td className="py-3.5 px-4">{vehicle.assignedDriver?.name || <span className="text-secondary-text/50">Unassigned</span>}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={vehicle.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(vehicle); }} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-primary-text transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(vehicle, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenDelete(vehicle, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 transition-colors" title="Delete">
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
      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Vehicle Details">
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-brand-border/60 pb-5">
              <div className="w-12 h-12 rounded bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">REGISTRATION</span>
                <h3 className="text-lg font-bold font-display text-primary-text font-mono tracking-tight">{selectedVehicle.regNumber}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Type</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 capitalize">{selectedVehicle.type}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Capacity</span>
                <span className="text-xs font-semibold text-primary-text block mt-1">{selectedVehicle.capacityKg.toLocaleString("en-IN")} kg</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Status</span>
                <div className="mt-1"><Badge status={selectedVehicle.status} /></div>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Assigned Driver</span>
                <span className="text-xs font-semibold text-primary-text block mt-1">{selectedVehicle.assignedDriver?.name || "Unassigned"}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-brand-border/60 pt-5">
              <Button variant="secondary" className="flex-1 text-xs uppercase" onClick={(e) => handleOpenEdit(selectedVehicle, e)}>
                Edit Vehicle
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === "create" ? "Add Vehicle" : "Edit Vehicle"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Registration Number"
            placeholder="E.g. GJ01AB1234"
            value={regNumber}
            onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
            required
            disabled={formMode === "edit"}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: "truck", label: "Truck" },
                { value: "van", label: "Van" },
                { value: "car", label: "Car" },
                { value: "bike", label: "Bike" },
              ]}
              value={type}
              onChange={(e: any) => setType(e.target.value)}
            />
            <Input
              label="Capacity (kg)"
              type="number"
              placeholder="E.g. 5000"
              value={capacityKg}
              onChange={(e) => setCapacityKg(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              options={[
                { value: "active", label: "Active" },
                { value: "under_maintenance", label: "Under Maintenance" },
                { value: "inactive", label: "Inactive" },
              ]}
              value={status}
              onChange={(e: any) => setStatus(e.target.value)}
            />
            <Select
              label="Assigned Driver (optional)"
              options={[
                { value: "", label: "Unassigned" },
                ...drivers.map((d) => ({ value: d._id, label: d.name })),
              ]}
              value={assignedDriver}
              onChange={(e: any) => setAssignedDriver(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save Vehicle
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Vehicle">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete vehicle <span className="font-mono text-primary-text font-bold">{vehicleToDelete?.regNumber}</span>. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete Vehicle
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};