import { User, Driver, Vehicle, Trip, Maintenance, Expense, ExpenseInput, UserRole } from "../types";

const API_BASE = (import.meta as any).env.VITE_API_URL || "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  options.credentials = "include";

  if (options.body && !(options.body instanceof FormData)) {
    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    };
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    let errorMsg = "API request failed";
    try {
      const errBody = await response.json();
      errorMsg = errBody.message || errBody.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      await request<{ userId: string; role: UserRole }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      // backend login only returns { userId, role } — fetch full profile after
      return request<User>("/api/auth/me");
    },
    register: (data: { name: string; email: string; password: string; role: UserRole }) =>
      request<{ message: string; userId: string }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    logout: () =>
      request<{ message: string }>("/api/auth/logout", { method: "POST" }),
    me: () => request<User>("/api/auth/me"),
  },

  // Driver endpoints return raw objects/arrays — no wrapper
  drivers: {
    list: () => request<Driver[]>("/api/drivers"),
    create: (data: Partial<Driver>) =>
      request<Driver>("/api/drivers", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Driver>) =>
      request<Driver>(`/api/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<{ message: string }>(`/api/drivers/${id}`, { method: "DELETE" }),
  },

  // Vehicle endpoints wrap responses under { success, vehicle(s), count }
  vehicles: {
    list: async () => {
      const res = await request<{ success: boolean; count: number; vehicles: Vehicle[] }>("/api/vehicles");
      return res.vehicles;
    },
    create: async (data: Partial<Vehicle>) => {
      const res = await request<{ success: boolean; message: string; vehicle: Vehicle }>("/api/vehicles", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.vehicle;
    },
    update: async (id: string, data: Partial<Vehicle>) => {
      const res = await request<{ success: boolean; message: string; vehicle: Vehicle }>(`/api/vehicles/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.vehicle;
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/vehicles/${id}`, { method: "DELETE" }),
  },

  trips: {
    list: async () => {
      const res = await request<{ success: boolean; count: number; trips: Trip[] }>("/api/trips");
      return res.trips;
    },
    create: async (data: Partial<Trip>) => {
      const res = await request<{ success: boolean; message: string; trip: Trip }>("/api/trips", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.trip;
    },
    update: async (id: string, data: Partial<Trip>) => {
      const res = await request<{ success: boolean; message: string; trip: Trip }>(`/api/trips/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.trip;
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/trips/${id}`, { method: "DELETE" }),
  },

  maintenance: {
    list: async () => {
      const res = await request<{ success: boolean; count: number; records: Maintenance[] }>("/api/maintenance");
      return res.records;
    },
    create: async (data: Partial<Maintenance>) => {
      const res = await request<{ success: boolean; message: string; record: Maintenance }>("/api/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.record;
    },
    update: async (id: string, data: Partial<Maintenance>) => {
      const res = await request<{ success: boolean; message: string; record: Maintenance }>(`/api/maintenance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.record;
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/maintenance/${id}`, { method: "DELETE" }),
  },

  expenses: {
    list: async () => {
      const res = await request<{ success: boolean; count: number; expenses: Expense[] }>("/api/expenses");
      return res.expenses;
    },
    create: async (data: ExpenseInput) => {
      const res = await request<{ success: boolean; message: string; expense: Expense }>("/api/expenses", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.expense;
    },
    update: async (id: string, data: Partial<ExpenseInput>) => {
      const res = await request<{ success: boolean; message: string; expense: Expense }>(`/api/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return res.expense;
    },
    approve: async (id: string) => {
      const res = await request<{ success: boolean; message: string; expense: Expense }>(`/api/expenses/${id}/approve`, {
        method: "PATCH",
      });
      return res.expense;
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/expenses/${id}`, { method: "DELETE" }),
  },

  // Backend only returns raw counts/status breakdowns — no monthly trend data exists yet
  performance: {
    drivers: async () => {
      const res = await request<{ success: boolean; stats: any[] }>("/api/performance/drivers");
      return res.stats;
    },
    vehicles: async () => {
      const res = await request<{ success: boolean; tripStats: any[]; maintenanceStats: any[] }>("/api/performance/vehicles");
      return res;
    },
  },

  analytics: {
    fleet: async () => {
      return request<{ success: boolean; byStatus: any[]; byType: any[] }>("/api/analytics/fleet");
    },
    expenses: async () => {
      return request<{ success: boolean; byCategory: any[]; totalSpent: number }>("/api/analytics/expenses");
    },
  },

  users: {
    list: async () => {
      const res = await request<{ success: boolean; count: number; users: User[] }>("/api/users");
      return res.users;
    },
    updateRole: async (id: string, role: UserRole) => {
      const res = await request<{ success: boolean; message: string; user: User }>(`/api/users/${id}/role`, {
        method: "PUT",
        body: JSON.stringify({ role }),
      });
      return res.user;
    },
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/users/${id}`, { method: "DELETE" }),
  },
};