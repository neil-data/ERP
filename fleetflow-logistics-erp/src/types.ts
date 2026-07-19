export type UserRole = 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: 'available' | 'on_trip' | 'off_duty';
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Populated reference shape — what .populate() actually returns
export interface PopulatedRef {
  _id: string;
  name: string;
  email?: string;
  licenseNumber?: string;
  regNumber?: string;
  type?: string;
  origin?: string;
  destination?: string;
}

export interface Vehicle {
  _id: string;
  regNumber: string;
  type: 'truck' | 'van' | 'car' | 'bike';
  capacityKg: number;
  status: 'active' | 'under_maintenance' | 'inactive';
  assignedDriver: PopulatedRef | null;
  registeredBy: PopulatedRef;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  _id: string;
  vehicle: PopulatedRef;
  driver: PopulatedRef;
  origin: string;
  destination: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDeparture: string;
  actualArrival: string | null;
  dispatchedBy: PopulatedRef;
  createdAt: string;
  updatedAt: string;
}

export interface Maintenance {
  _id: string;
  vehicle: PopulatedRef;
  type: 'oil_change' | 'tire_replacement' | 'general_service' | 'repair' | 'inspection';
  description: string;
  cost: number;
  date: string;
  nextDueDate: string | null;
  performedBy: string;
  loggedBy: PopulatedRef;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  _id: string;
  trip: PopulatedRef;
  category: 'fuel' | 'toll' | 'food' | 'lodging' | 'repair' | 'other';
  amount: number;
  date: string;
  notes: string;
  approvedBy: PopulatedRef | null;
  addedBy: PopulatedRef;
  createdAt: string;
  updatedAt: string;
}

// Input shape for creating/updating an Expense — refs are string IDs, not populated objects
export interface ExpenseInput {
  trip: string;
  category: Expense["category"];
  amount: number;
  date?: string;
  notes?: string;
}