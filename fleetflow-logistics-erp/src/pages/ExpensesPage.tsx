import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Edit, Trash2, Download, Eye, Receipt, Check, X, IndianRupee, ShieldCheck } from "lucide-react";
import { api } from "../services/api";
import { Expense, Trip, User } from "../types";
import { Button, Input, Select, Badge, Drawer, Modal, Skeleton } from "../components/UI";

interface ExpensesPageProps {
  user: User;
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const ExpensesPage: React.FC<ExpensesPageProps> = ({ user, showToast }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // all | pending | approved

  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);

  // Form fields — matches real Expense schema only
  const [tripId, setTripId] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("fuel");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const canApprove = user.role === "fleet_manager";

  const fetchExpensesAndDetails = async () => {
    setLoading(true);
    try {
      const [expensesData, tripsData] = await Promise.all([api.expenses.list(), api.trips.list()]);
      setExpenses(expensesData);
      setTrips(tripsData);
    } catch (err: any) {
      showToast(err.message || "Could not retrieve expense ledger", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpensesAndDetails();
  }, []);

  const handleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredExpenses = expenses
    .filter((e) => {
      const matchesSearch =
        e.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.trip?.origin && e.trip.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (e.addedBy?.name && e.addedBy.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && e.approvedBy) ||
        (statusFilter === "pending" && !e.approvedBy);
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === "date") {
        const valA = new Date(a.date).getTime();
        const valB = new Date(b.date).getTime();
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
    });

  const handleOpenCreate = () => {
    setFormMode("create");
    setTripId("");
    setCategory("fuel");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setIsFormOpen(true);
  };

  const handleOpenEdit = (eItem: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormMode("edit");
    setSelectedExpense(eItem);
    setTripId(eItem.trip?._id || "");
    setCategory(eItem.category);
    setAmount(String(eItem.amount));
    setDate(eItem.date ? eItem.date.split("T")[0] : "");
    setNotes(eItem.notes);
    setIsFormOpen(true);
  };

  const handleOpenDetail = (eItem: Expense) => {
    setSelectedExpense(eItem);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (eItem: Expense, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpenseToDelete(eItem);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripId || !category || !amount) {
      showToast("Trip, category and amount are required.", "warning");
      return;
    }

    setSubmitLoading(true);
    const payload = {
      trip: tripId,
      category,
      amount: Number(amount),
      date: date ? new Date(date).toISOString() : undefined,
      notes,
    };

    try {
      if (formMode === "create") {
        await api.expenses.create(payload);
        showToast("Expense filed.", "success");
      } else if (formMode === "edit" && selectedExpense) {
        await api.expenses.update(selectedExpense._id, payload);
        showToast("Expense updated.", "success");
      }
      setIsFormOpen(false);
      fetchExpensesAndDetails();
    } catch (err: any) {
      showToast(err.message || "Failed to save expense", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async (eItem: Expense) => {
    try {
      await api.expenses.approve(eItem._id);
      showToast("Expense approved.", "success");
      setIsDetailOpen(false);
      fetchExpensesAndDetails();
    } catch (err: any) {
      showToast(err.message || "Could not approve expense", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete) return;
    try {
      await api.expenses.delete(expenseToDelete._id);
      showToast("Expense deleted.", "success");
      setIsDeleteOpen(false);
      setExpenseToDelete(null);
      fetchExpensesAndDetails();
    } catch (err: any) {
      showToast(err.message || "Failed to delete expense", "error");
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      showToast("No expenses to export.", "warning");
      return;
    }
    const headers = "ID,Trip,Category,Amount (INR),Date,Status,Added By,Notes\n";
    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers +
      expenses
        .map(
          (e) =>
            `"${e._id}","${e.trip?.origin} -> ${e.trip?.destination}","${e.category}",${e.amount},"${e.date}","${e.approvedBy ? "Approved" : "Pending"}","${e.addedBy?.name}","${e.notes}"`
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "FleetFlow_Expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV export complete.", "success");
  };

  const approvedTotal = expenses.filter((e) => e.approvedBy).reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter((e) => !e.approvedBy).length;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">FINANCIAL LEDGER</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            Trip Expenses
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleExportCSV} className="font-mono text-xs flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" />
            <span>FILE EXPENSE</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-brand-border rounded p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-secondary-text uppercase block">Approved Total</span>
            <span className="text-xl font-bold text-primary-text font-display mt-1 block">₹{approvedTotal.toLocaleString("en-IN")}</span>
          </div>
          <div className="w-9 h-9 rounded bg-green-950/20 border border-green-900/30 flex items-center justify-center text-green-400">
            <IndianRupee className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-card border border-brand-border rounded p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-secondary-text uppercase block">Pending Approval</span>
            <span className="text-xl font-bold text-accent font-display mt-1 block">{pendingCount} filings</span>
          </div>
          <div className="w-9 h-9 rounded bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
            <Receipt className="w-4.5 h-4.5" />
          </div>
        </div>

        <div className="bg-card border border-brand-border rounded p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-secondary-text uppercase block">Approval Rights</span>
            <span className="text-xs font-semibold text-primary-text mt-1.5 block">
              {canApprove ? (
                <span className="text-green-400 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 shrink-0" /> Authorized
                </span>
              ) : (
                <span className="text-secondary-text/80">Read & File Only</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-xs shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-text">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search notes, route, filer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-brand-border rounded pl-9 pr-3 py-2 text-xs outline-none focus:border-accent/60 text-primary-text font-sans"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-secondary-text shrink-0" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              <option value="fuel">Fuel</option>
              <option value="toll">Toll</option>
              <option value="food">Food</option>
              <option value="lodging">Lodging</option>
              <option value="repair">Repair</option>
              <option value="other">Other</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-brand-border text-xs rounded px-2.5 py-1.5 outline-none focus:border-accent text-primary-text w-full sm:w-auto"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-16 text-center text-secondary-text flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded bg-surface border border-brand-border/60 flex items-center justify-center text-secondary-text">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary-text">No Expenses Found</p>
              <p className="text-xs text-secondary-text/70 mt-1 max-w-sm">
                No expenses match your filters, or none exist yet.
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleOpenCreate} className="mt-2 text-xs">
              File First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th onClick={() => handleSort("date")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Date {sortField === "date" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Trip</th>
                  <th className="py-3 px-4">Category</th>
                  <th onClick={() => handleSort("amount")} className="py-3 px-4 cursor-pointer hover:text-accent select-none">
                    Amount {sortField === "amount" && (sortOrder === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="py-3 px-4">Filed By</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense._id}
                    onClick={() => handleOpenDetail(expense)}
                    className="hover:bg-surface/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono">{new Date(expense.date).toLocaleDateString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold">{expense.trip?.origin} ➔ {expense.trip?.destination}</td>
                    <td className="py-3.5 px-4 font-sans font-medium text-primary-text capitalize">{expense.category}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-primary-text">₹{expense.amount.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-4 font-sans">{expense.addedBy?.name}</td>
                    <td className="py-3.5 px-4">
                      <Badge status={expense.approvedBy ? "approved" : "pending"} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); handleOpenDetail(expense); }} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-primary-text transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleOpenEdit(expense, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        {canApprove && (
                          <button onClick={(e) => handleOpenDelete(expense, e)} className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
      <Drawer isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Expense Details">
        {selectedExpense && (
          <div className="space-y-6 font-sans">
            <div className="flex items-center gap-4 border-b border-brand-border/60 pb-5">
              <div className="w-12 h-12 rounded bg-accent/5 border border-accent/20 flex items-center justify-center text-accent">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-accent uppercase tracking-wider">EXPENSE</span>
                <h3 className="text-lg font-bold font-display text-primary-text font-mono tracking-tight">₹{selectedExpense.amount.toLocaleString("en-IN")}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-surface border border-brand-border rounded col-span-2">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Trip</span>
                <span className="text-xs font-mono font-bold text-primary-text block mt-1">{selectedExpense.trip?.origin} ➔ {selectedExpense.trip?.destination}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Category</span>
                <span className="text-xs font-semibold text-primary-text block mt-1 capitalize">{selectedExpense.category}</span>
              </div>
              <div className="p-3 bg-surface border border-brand-border rounded">
                <span className="text-[10px] text-secondary-text uppercase tracking-wider font-display font-medium block">Filed By</span>
                <span className="text-xs font-semibold text-primary-text block mt-1">{selectedExpense.addedBy?.name}</span>
              </div>
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-3">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2">Status</div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Date</span>
                <span className="font-mono text-primary-text font-bold">{new Date(selectedExpense.date).toLocaleDateString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-secondary-text">Approval State</span>
                <Badge status={selectedExpense.approvedBy ? "approved" : "pending"} />
              </div>
              {selectedExpense.approvedBy && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary-text">Approved By</span>
                  <span className="font-mono text-primary-text font-bold">{selectedExpense.approvedBy.name}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-surface border border-brand-border rounded space-y-2">
              <div className="text-xs font-mono text-secondary-text uppercase tracking-widest border-b border-brand-border/40 pb-2">Notes</div>
              <p className="text-xs text-primary-text leading-relaxed font-sans">{selectedExpense.notes || "No notes."}</p>
            </div>

            {canApprove && !selectedExpense.approvedBy && (
              <div className="flex items-center gap-3 border-t border-brand-border/60 pt-5">
                <button
                  onClick={() => handleApprove(selectedExpense)}
                  className="flex-1 bg-green-950/20 hover:bg-green-950/40 text-green-400 border border-green-900/40 py-2 rounded text-xs uppercase font-mono font-bold flex items-center justify-center gap-1.5 transition-all outline-none"
                >
                  <Check className="w-4 h-4" /> Approve Expense
                </button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* CREATE / EDIT MODAL */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === "create" ? "File Expense" : "Edit Expense"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Trip</label>
            <select
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
              className="bg-surface border border-brand-border rounded text-sm px-3 py-2 text-primary-text outline-none focus:border-accent"
              required
            >
              <option value="">-- Select Trip --</option>
              {trips.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.origin} ➔ {t.destination}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={[
                { value: "fuel", label: "Fuel" },
                { value: "toll", label: "Toll" },
                { value: "food", label: "Food" },
                { value: "lodging", label: "Lodging" },
                { value: "repair", label: "Repair" },
                { value: "other", label: "Other" },
              ]}
              value={category}
              onChange={(e: any) => setCategory(e.target.value)}
            />
            <Input
              label="Amount (INR)"
              type="number"
              placeholder="E.g. 2500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-secondary-text tracking-wide uppercase font-display">Notes</label>
            <textarea
              placeholder="E.g. Diesel refill at Surat pump"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface border border-brand-border rounded p-3 text-sm text-primary-text transition-all outline-none focus:border-accent"
              rows={3}
            />
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete Expense">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <X className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete this expense filing. This action is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete Expense
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};