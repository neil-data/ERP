import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Download, Eye, Wrench, AlertCircle } from "lucide-react";
import { api } from "../services/api";
import { Maintenance, Vehicle } from "../types";
import { Button, Input, Select, Drawer, Modal, Skeleton } from "../components/UI";

interface MaintenancePageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ showToast }) => {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const [sortField, setSortField] = useState<"date" | "cost">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedRecord, setSelectedRecord] = useState<Maintenance | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Maintenance | null>(null);

  // Form fields — matches real Maintenance schema only
  const [vehicleId, setVehicleId] = useState("");
  const [type, setType] = useState<Maintenance["type"]>("general_service");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [date, setDate] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchLogsAndVehicles = async () => {
    setLoading(true);
    try {
      const [maintData, vehiclesData] = await Promise.all([api.maintenance.list(), api.vehicles.list()]);
      setMaintenance(maintData);
      setVehicles(vehiclesData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve maintenance records", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogsAndVehicles();
  }, []);

  const handleSort = (field: "date" | "cost") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredLogs = maintenance
    .filter((log) => {
      const matchesSearch =
        (log.vehicle?.regNumber && log.vehicle.regNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performedBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || log.type === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortField === "date") {
        const valA = new Date(a.date).getTime();
        const valB = new Date(b.date).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc" ? a.cost - b.cost : b.cost - a.cost;
    });

  const handleOpenCreate = () => {
    setFormMode("create");
    setVehicleId("");
    setType("general_service");
    setDescription("");
    setCost("");
    setDate(new Date().toISOString().split("T")[0]);
    setNextDueDate("");
    setPerformedBy("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: Maintenance, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setSelectedRecord(m);
    setVehicleId(m.vehicle?._id || "");
    setType(m.type);
    setDescription(m.description);
    setCost(String(m.cost));
    setDate(m.date ? m.date.split("T")[0] : "");
    setNextDueDate(m.nextDueDate ? m.nextDueDate.split("T")[0] : "");
    setPerformedBy(m.performedBy);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (m: Maintenance) => {
    setSelectedRecord(m);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (m: Maintenance, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToDelete(m);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !type || !cost) {
      showToast("Vehicle, type and cost are required.", "warning");
      return;
    }

    setSubmitLoading(true);
    const payload: any = {
      vehicle: vehicleId,
      type,
      description,
      cost: Number(cost),
      performedBy,
    };
    if (date) payload.date = new Date(date).toISOString();
    if (nextDueDate) payload.nextDueDate = new Date(nextDueDate).toISOString();

    try {
      if (formMode === "create") {
        await api.maintenance.create(payload);
        showToast("Maintenance record logged.", "success");
      } else if (formMode === "edit" && selectedRecord) {
        await api.maintenance.update(selectedRecord._id, payload);
        showToast("Maintenance record updated.", "success");
      }
      setIsFormOpen(false);
      fetchLogsAndVehicles();
    } catch (err: any) {
      showToast(err.message || "Failed to save record", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    try {
      await api.maintenance.delete(recordToDelete._id);
      showToast("Maintenance record deleted.", "success");
      setIsDeleteOpen(false);
      setRecordToDelete(null);
      fetchLogsAndVehicles();
    } catch (err: any) {
      showToast(err.message || "Failed to delete record", "error");
    }
  };

  const handleExportCSV = () => {
    if (maintenance.length === 0) {
      showToast("No records available to export.", "warning");
      return;
    }
    const headers = "ID,Vehicle,Type,Cost (INR),Date,Next Due,Performed By\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      maintenance
        .map(
          (m) =>
            `"${m._id}","${m.vehicle?.regNumber}","${m.type}",${m.cost},"${m.date}","${m.nextDueDate || ""}","${m.performedBy}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FleetFlow_Maintenance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export complete.", "success");
  };

  const typeLabel = (t: string) => t.replace(/_/g, " ");

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FLEET SERVICE</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Maintenance Log
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="font-mono text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span>LOG SERVICE</span>
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
            placeholder="Search vehicle, description, mechanic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-brand-border rounded pl-9 pr-3 py-2 text-xs outline-none focus:border-accent/60 text-primary-text font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full justify-end">
          <Filter className="w-3.5 h-3.5 text-secondary-text shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
          >
            <option value="all">All Types</option>
            <option value="oil_change">Oil Change</option>
            <option value="tire_replacement">Tire Replacement</option>
            <option value="general_service">General Service</option>
            <option value="repair">Repair</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-secondary-text flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded bg-surface border border-brand-border/60 flex items-center justify-center text-secondary-text">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text">No Maintenance Records</p>
              <p className="text-xs text-secondary-text/70 mt-1 max-w-sm">
                No records match your filters, or none exist yet.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs">
              Log First Service
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Type</th>
                  <th onClick={() => handleSort("date")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Date {sortField === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Next Due</th>
                  <th onClick={() => handleSort("cost")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Cost {sortField === "cost" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Performed By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredLogs.map((log) => (
                  <tr
                    key={log._id}
                    onClick={() => handleOpenDetail(log)}
                    className="hover:bg-surface/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-text">{log.vehicle?.regNumber}</td>
                    <td className="py-3.5 px-4 font-sans font-medium text-primary-text capitalize">{typeLabel(log.type)}</td>
                    <td className="py-3.5 px-4 font-mono">{new Date(log.date).toLocaleDateString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono">{log.nextDueDate ? new Date(log.nextDueDate).toLocaleDateString("en-IN") : "—"}</td>
                    <td className="py-3.5 px-4 font-mono text-primary-text">₹{log.cost.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4">{log.performedBy || "—"}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(log); }} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-primary-text transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(log, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenDelete(log, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 transition-colors" title="Delete">
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
      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Maintenance Record">
        {selectedRecord && (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-4 border-b border-brand-border/60 pb-5">
              <div className="w-12 h-12 rounded bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">SERVICE RECORD</span>
                <h3 className="text-lg font-bold font-display text-primary-text font-mono tracking-tight">{selectedRecord.vehicle?.regNumber}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Type</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 capitalize">{typeLabel(selectedRecord.type)}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Cost</span>
                <span className="text-xs font-mono font-semibold text-primary-text block mt-1">₹{selectedRecord.cost.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-3">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2">Timing</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Date</span>
                <span className="font-mono text-primary-text font-bold">{new Date(selectedRecord.date).toLocaleDateString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Next Due</span>
                <span className="font-mono text-primary-text font-bold">{selectedRecord.nextDueDate ? new Date(selectedRecord.nextDueDate).toLocaleDateString("en-IN") : "Not scheduled"}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Performed By</span>
                <span className="font-mono text-primary-text font-bold">{selectedRecord.performedBy || "—"}</span>
              </div>
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-2">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2">Description</div>
              <p className="text-xs text-primary-text leading-relaxed font-sans">{selectedRecord.description || "No description recorded."}</p>
            </div>

            <div className="flex items-center gap-3 border-t border-brand-border/60 pt-5">
              <Button variant="secondary" className="flex-1 text-xs uppercase" onClick={(e) => handleOpenEdit(selectedRecord, e)}>
                Edit Record
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === "create" ? "Log Maintenance" : "Edit Maintenance Record"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="bg-surface border border-brand-border rounded text-sm px-3 py-2 text-primary-text outline-none focus:border-accent"
              required
            >
              <option value="">-- Select Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.regNumber} ({v.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              options={[
                { value: "oil_change", label: "Oil Change" },
                { value: "tire_replacement", label: "Tire Replacement" },
                { value: "general_service", label: "General Service" },
                { value: "repair", label: "Repair" },
                { value: "inspection", label: "Inspection" },
              ]}
              value={type}
              onChange={(e: any) => setType(e.target.value)}
            />
            <Input
              label="Cost (INR)"
              type="number"
              placeholder="E.g. 1500"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Service Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Next Due Date (optional)"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          <Input
            label="Performed By (workshop/mechanic)"
            placeholder="E.g. City Garage"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Description</label>
            <textarea
              placeholder="E.g. Oil filter swap, brake pad thickness checked..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface border border-brand-border rounded p-3 text-sm text-primary-text transition-all outline-none focus:border-accent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Maintenance Record">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete this maintenance record for <span className="font-mono text-primary-text font-bold">{recordToDelete?.vehicle?.regNumber}</span>. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};