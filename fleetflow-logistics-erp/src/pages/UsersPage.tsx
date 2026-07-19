import React, { useEffect, useState } from "react";
import { Search, Edit, Trash2, Shield, UserPlus, Key } from "lucide-react";
import { api } from "../services/api";
import { User, UserRole } from "../types";
import { Button, Input, Select, Modal, Skeleton } from "../components/UI";

interface UsersPageProps {
  currentUser: User;
  showToast: (msg: string, type: "success" | "error" | "warning" | "info") => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({ currentUser, showToast }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("dispatcher");
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.list();
      setUsers(data);
    } catch (err: any) {
      showToast(err.message || "Failed to retrieve user accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setFormMode("create");
    setName("");
    setEmail("");
    setPassword("");
    setRole("dispatcher");
    setIsFormOpen(true);
  };

  const handleOpenEditRole = (u: User) => {
    setFormMode("edit");
    setSelectedUser(u);
    setRole(u.role);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (u: User) => {
    setUserToDelete(u);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      if (formMode === "create") {
        if (!name || !email || !password) {
          showToast("Please provide all registration fields.", "warning");
          setSubmitLoading(false);
          return;
        }
        await api.auth.register({ name, email, password, role });
        showToast("New user account created.", "success");
      } else if (formMode === "edit" && selectedUser) {
        await api.users.updateRole(selectedUser._id, role);
        showToast("User role updated.", "success");
      }
      setIsFormOpen(false);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Could not save user", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    if (userToDelete._id === currentUser._id) {
      showToast("You cannot delete your own account.", "warning");
      setIsDeleteOpen(false);
      return;
    }

    try {
      await api.users.delete(userToDelete._id);
      showToast("User account deleted.", "success");
      setIsDeleteOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || "Failed to delete user", "error");
    }
  };

  const getRoleLabel = (r: UserRole) => {
    switch (r) {
      case "fleet_manager": return "Fleet Manager";
      case "dispatcher": return "Dispatcher";
      case "safety_officer": return "Safety Officer";
      case "financial_analyst": return "Financial Analyst";
      default: return r;
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <span className="text-xs font-mono text-accent uppercase tracking-widest">USER MANAGEMENT</span>
          <h1 className="text-2xl font-bold font-display text-primary-text tracking-tight mt-1">
            User Accounts
          </h1>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate} className="font-mono text-xs flex items-center gap-2">
          <UserPlus className="w-3.5 h-3.5" />
          <span>ADD USER</span>
        </Button>
      </div>

      <div className="bg-card border border-brand-border rounded p-4">
        <div className="relative w-full md:max-w-xs shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-secondary-text">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search name, email, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-brand-border rounded pl-9 pr-3 py-2 text-xs outline-none focus:border-accent/60 text-primary-text font-sans"
          />
        </div>
      </div>

      <div className="bg-card border border-brand-border rounded overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center text-secondary-text">
            No accounts match this search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-secondary-text">
              <thead>
                <tr className="border-b border-brand-border bg-surface/30 text-[10px] font-mono uppercase tracking-wider text-secondary-text/80">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-surface/10 transition-colors">
                    <td className="py-3.5 px-4 font-sans text-primary-text font-bold">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-surface border border-brand-border flex items-center justify-center text-accent text-[10px] font-mono font-bold">
                          {userItem.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span>{userItem.name} {userItem._id === currentUser._id && "(You)"}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">{userItem.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] bg-accent/5 border border-accent/20 text-accent font-semibold">
                        <Shield className="w-3 h-3" />
                        <span>{getRoleLabel(userItem.role)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditRole(userItem)}
                          className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-accent transition-colors"
                          title="Edit role"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(userItem)}
                          disabled={userItem._id === currentUser._id}
                          className="p-1.5 rounded hover:bg-surface text-secondary-text hover:text-red-400 disabled:opacity-30 transition-colors"
                          title="Delete user"
                        >
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

      {/* CREATE / EDIT ROLE MODAL */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={formMode === "create" ? "Add User" : "Edit Role"}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formMode === "create" ? (
            <>
              <Input
                label="Full Name"
                placeholder="E.g. Vivek Malhotra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                placeholder="E.g. vivek@fleetflow.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Key className="absolute right-3 bottom-3 w-4 h-4 text-secondary-text/60" />
              </div>
            </>
          ) : (
            <div className="p-3 bg-surface border border-brand-border rounded space-y-1">
              <span className="text-[10px] text-secondary-text uppercase tracking-wider block">Editing</span>
              <span className="text-xs font-bold text-primary-text block">{selectedUser?.name} ({selectedUser?.email})</span>
            </div>
          )}

          <Select
            label="Role"
            options={[
              { value: "fleet_manager", label: "Fleet Manager" },
              { value: "dispatcher", label: "Dispatcher" },
              { value: "safety_officer", label: "Safety Officer" },
              { value: "financial_analyst", label: "Financial Analyst" },
            ]}
            value={role}
            onChange={(e: any) => setRole(e.target.value)}
          />

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" type="button" onClick={() => setIsFormOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={submitLoading} className="text-xs uppercase">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Delete User">
        <div className="space-y-4 font-sans">
          <div className="flex items-start gap-3 text-red-400 border border-red-900/40 bg-red-950/20 rounded p-4 text-xs">
            <Shield className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">WARNING</span>
              <p className="text-secondary-text mt-1 leading-relaxed">
                You are about to delete <span className="font-sans text-primary-text font-bold">{userToDelete?.name}</span>'s account. This is irreversible.
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-brand-border/40 pt-4 mt-6">
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm} className="text-xs uppercase">
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};