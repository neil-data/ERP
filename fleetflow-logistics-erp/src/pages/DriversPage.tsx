import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Download, Eye, ShieldAlert, UserCheck } from "lucide-react";
import { api } from "../services/api";
import { Driver } from "../types";
import { Button, Input, Select, Badge, Drawer, Modal, Skeleton } from "../components/UI";

interface DriversPageProps {
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const DriversPage: React.FC<DriversPageProps> = ({ showToast }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [sortField, setSortField] = useState<"name" | "licenseNumber">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<Driver | null>(null);

  // Form fields — matches real Driver schema only
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"available" | "on_trip" | "off_duty">("available");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await api.drivers.list();
      setDrivers(data);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve driver registry", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSort = (field: "name" | "licenseNumber") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredDrivers = drivers
    .filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.phone.includes(searchQuery);
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

  const handleOpenCreate = () => {
    setFormMode("create");
    setName("");
    setLicenseNumber("");
    setPhone("");
    setStatus("available");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (d: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setSelectedDriver(d);
    setName(d.name);
    setLicenseNumber(d.licenseNumber);
    setPhone(d.phone);
    setStatus(d.status);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (d: Driver) => {
    setSelectedDriver(d);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (d: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    setDriverToDelete(d);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licenseNumber || !phone) {
      showToast("Please fill in all required fields.", "warning");
      return;
    }

    setSubmitLoading(true);
    const payload = { name, licenseNumber, phone, status };

    try {
      if (formMode === "create") {
        await api.drivers.create(payload);
        showToast("Driver registered successfully.", "success");
      } else if (formMode === "edit" && selectedDriver) {
        await api.drivers.update(selectedDriver._id, payload);
        showToast("Driver updated successfully.", "success");
      }
      setIsFormOpen(false);
      fetchDrivers();
    } catch (err: any) {
      showToast(err.message || "Failed to save driver", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!driverToDelete) return;
    try {
      await api.drivers.delete(driverToDelete._id);
      showToast("Driver deleted.", "success");
      setIsDeleteOpen(false);
      setDriverToDelete(null);
      fetchDrivers();
    } catch (err: any) {
      showToast(err.message || "Failed to delete driver", "error");
    }
  };

  const handleExportCSV = () => {
    if (drivers.length === 0) {
      showToast("No records to export.", "warning");
      return;
    }
    const headers = "ID,Name,License Number,Phone,Status\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      drivers
        .map((d) => `"${d._id}","${d.name}","${d.licenseNumber}","${d.phone}","${d.status}"`)
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FleetFlow_Drivers_Registry.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export complete.", "success");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FLEET PERSONNEL</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Driver Registry
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="font-mono text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span>ADD DRIVER</span>
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
            placeholder="Search by name, license or phone..."
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
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="off_duty">Off Duty</option>
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
        ) : filteredDrivers.length === 0 ? (
          <div className="py-16 text-center text-secondary-text flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded bg-surface border border-brand-border/60 flex items-center justify-center text-secondary-text">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text">No Drivers Found</p>
              <p className="text-xs text-secondary-text/70 mt-1 max-w-sm">
                No drivers match your query, or none exist yet.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs">
              Add First Driver
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th onClick={() => handleSort("name")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Name {sortField === "name" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th onClick={() => handleSort("licenseNumber")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    License Number {sortField === "licenseNumber" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredDrivers.map((driver) => (
                  <tr
                    key={driver._id}
                    onClick={() => handleOpenDetail(driver)}
                    className="hover:bg-surface/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-sans text-primary-text font-bold">{driver.name}</td>
                    <td className="py-3.5 px-4 font-mono">{driver.licenseNumber}</td>
                    <td className="py-3.5 px-4 font-mono text-primary-text">{driver.phone}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={driver.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(driver); }} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-primary-text transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(driver, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenDelete(driver, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 transition-colors" title="Delete">
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
      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Driver Details">
        {selectedDriver && (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-4 border-b border-brand-border/60 pb-5">
              <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center font-bold text-accent font-display text-lg">
                {selectedDriver.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">DRIVER</span>
                <h3 className="text-lg font-bold font-display text-primary-text tracking-tight">{selectedDriver.name}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">License No</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 font-mono">{selectedDriver.licenseNumber}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Phone</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 font-mono">{selectedDriver.phone}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded col-span-2">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Status</span>
                <div className="mt-1"><Badge status={selectedDriver.status} /></div>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-brand-border/60 pt-5">
              <Button variant="secondary" className="flex-1 text-xs uppercase" onClick={(e) => handleOpenEdit(selectedDriver, e)}>
                Edit Driver
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === "create" ? "Add Driver" : "Edit Driver"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="E.g. Rajesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="License Number"
            placeholder="E.g. GJ01AB1234"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
            required
          />
          <Input
            label="Phone Number"
            placeholder="E.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Select
            label="Status"
            options={[
              { value: "available", label: "Available" },
              { value: "on_trip", label: "On Trip" },
              { value: "off_duty", label: "Off Duty" },
            ]}
            value={status}
            onChange={(e: any) => setStatus(e.target.value)}
          />

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save Driver
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Driver">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete driver <span className="font-sans text-primary-text font-bold">{driverToDelete?.name}</span>. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete Driver
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};