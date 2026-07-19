import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "fleetflow-db.json");

// Helper to parse cookies from request headers without extra packages
function getCookie(req: express.Request, name: string): string | null {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const list: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts[0].trim()] = parts[1] ? parts[1].trim() : "";
  });
  return list[name] || null;
}

// Interfaces matching src/types.ts
interface User {
  id: string;
  name: string;
  email: string;
  role: 'fleet_manager' | 'dispatcher' | 'safety_officer' | 'financial_analyst';
  password?: string;
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  status: 'Available' | 'On Trip' | 'On Leave';
  vehicleId?: string;
  rating: number;
  tripsCompleted: number;
  safetyScore: number;
}

interface Vehicle {
  id: string;
  registrationNumber: string;
  model: string;
  type: 'Heavy Truck' | 'Medium Truck' | 'Light Commercial';
  capacity: number;
  fuelType: 'Diesel' | 'CNG' | 'Electric';
  status: 'Active' | 'In Maintenance' | 'Inactive';
  currentMileage: number;
  nextServiceKm: number;
}

interface Trip {
  id: string;
  tripNumber: string;
  vehicleId: string;
  driverId: string;
  origin: string;
  destination: string;
  startDate: string;
  endDate?: string;
  status: 'Scheduled' | 'In Transit' | 'Completed' | 'Cancelled';
  weight: number;
  expenseAmount: number;
}

interface Maintenance {
  id: string;
  vehicleId: string;
  serviceType: 'Engine Oil' | 'Brake System' | 'Tire Replacement' | 'General Service';
  scheduledDate: string;
  completedDate?: string;
  cost: number;
  status: 'Scheduled' | 'In Progress' | 'Completed';
  notes: string;
}

interface Expense {
  id: string;
  tripId?: string;
  vehicleId: string;
  category: 'Fuel' | 'Toll' | 'Driver Allowance' | 'Maintenance' | 'Permit/Tax';
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedBy: string;
  description: string;
}

interface Database {
  users: User[];
  drivers: Driver[];
  vehicles: Vehicle[];
  trips: Trip[];
  maintenance: Maintenance[];
  expenses: Expense[];
}

// Seed high-fidelity, Indian localized logistics data
const DEFAULT_DB: Database = {
  users: [
    { id: "u1", name: "Anand Verma", email: "admin@fleetflow.in", role: "fleet_manager", password: "password" },
    { id: "u2", name: "Sanjay Mehra", email: "dispatch@fleetflow.in", role: "dispatcher", password: "password" },
    { id: "u3", name: "Captain Amit Singh", email: "safety@fleetflow.in", role: "safety_officer", password: "password" },
    { id: "u4", name: "Pooja Sharma", email: "finance@fleetflow.in", role: "financial_analyst", password: "password" },
  ],
  drivers: [
    { id: "D1", name: "Rajesh Kumar", licenseNumber: "DL-14-2019-0012345", phone: "9876543210", status: "On Trip", rating: 4.8, tripsCompleted: 142, safetyScore: 94 },
    { id: "D2", name: "Gurpreet Singh", licenseNumber: "PB-02-2015-0876543", phone: "9812345678", status: "Available", rating: 4.9, tripsCompleted: 230, safetyScore: 98 },
    { id: "D3", name: "Muthu Karuppan", licenseNumber: "TN-05-2018-0987654", phone: "9444012345", status: "On Leave", rating: 4.5, tripsCompleted: 89, safetyScore: 88 },
    { id: "D4", name: "Amit Yadav", licenseNumber: "HR-26-2021-0005432", phone: "9999123456", status: "Available", rating: 4.7, tripsCompleted: 64, safetyScore: 91 },
  ],
  vehicles: [
    { id: "V1", registrationNumber: "MH-12-QG-4567", model: "Tata Prima 4930.S", type: "Heavy Truck", capacity: 40, fuelType: "Diesel", status: "Active", currentMileage: 184500, nextServiceKm: 190000 },
    { id: "V2", registrationNumber: "DL-01-MA-1234", model: "Ashok Leyland Ecomet", type: "Medium Truck", capacity: 16, fuelType: "Diesel", status: "Active", currentMileage: 92100, nextServiceKm: 95000 },
    { id: "V3", registrationNumber: "KA-03-MM-8901", model: "Mahindra Blazo X", type: "Heavy Truck", capacity: 35, fuelType: "Diesel", status: "In Maintenance", currentMileage: 241200, nextServiceKm: 241500 },
    { id: "V4", registrationNumber: "GJ-01-XX-9876", model: "Tata Ultra T.7", type: "Light Commercial", capacity: 7, fuelType: "Electric", status: "Active", currentMileage: 43500, nextServiceKm: 50000 },
  ],
  trips: [
    { id: "T1", tripNumber: "FT-2026-1001", vehicleId: "V1", driverId: "D1", origin: "Mumbai Port", destination: "Delhi NCR", startDate: "2026-07-15", status: "In Transit", weight: 38.5, expenseAmount: 42000 },
    { id: "T2", tripNumber: "FT-2026-1002", vehicleId: "V2", driverId: "D2", origin: "Chennai SEZ", destination: "Bengaluru Hub", startDate: "2026-07-16", status: "Scheduled", weight: 14.2, expenseAmount: 12000 },
    { id: "T3", tripNumber: "FT-2026-1003", vehicleId: "V4", driverId: "D4", origin: "Ahmedabad", destination: "Pune Logistics Park", startDate: "2026-07-10", endDate: "2026-07-12", status: "Completed", weight: 6.8, expenseAmount: 8500 },
  ],
  maintenance: [
    { id: "M1", vehicleId: "V3", serviceType: "Engine Oil", scheduledDate: "2026-07-14", status: "In Progress", cost: 18500, notes: "Routine oil change and filter replacements." },
    { id: "M2", vehicleId: "V1", serviceType: "Tire Replacement", scheduledDate: "2026-07-01", completedDate: "2026-07-02", status: "Completed", cost: 74000, notes: "Replaced 6 rear radial tires." },
  ],
  expenses: [
    { id: "E1", tripId: "T1", vehicleId: "V1", category: "Fuel", amount: 28500, date: "2026-07-15", status: "Approved", submittedBy: "Anand Verma", description: "250L Diesel refueled at HP Outlet, Pune Bypass." },
    { id: "E2", tripId: "T1", vehicleId: "V1", category: "Toll", amount: 8200, date: "2026-07-15", status: "Pending", submittedBy: "Anand Verma", description: "Fastag auto-deductions between Mumbai and Surat." },
    { id: "E3", vehicleId: "V3", category: "Maintenance", amount: 18500, date: "2026-07-14", status: "Pending", submittedBy: "Sanjay Mehra", description: "Engine oil service charge." },
  ],
};

function readDb(): Database {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading database file, using defaults:", error);
  }
  return DEFAULT_DB;
}

function writeDb(data: Database) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

// Bootstrap database file
if (!fs.existsSync(DB_FILE)) {
  writeDb(DEFAULT_DB);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Middleware: Parse current user from session token cookie
  app.use((req, res, next) => {
    const userId = getCookie(req, "authToken");
    if (userId) {
      const db = readDb();
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        (req as any).user = user;
      }
    }
    next();
  });

  // --- AUTHENTICATION API ---
  app.post("/api/auth/register", (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const db = readDb();
    if (db.users.find((u) => u.email === email)) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const newUser: User = {
      id: "u_" + Date.now(),
      name,
      email,
      role,
      password,
    };

    db.users.push(newUser);
    writeDb(db);

    res.cookie("authToken", newUser.id, { httpOnly: true, maxAge: 86400000 });
    const { password: _, ...userWithoutPassword } = newUser;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const db = readDb();
    const user = db.users.find((u) => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.setHeader("Set-Cookie", `authToken=${user.id}; HttpOnly; Path=/; Max-Age=86400000; SameSite=Lax`);
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    res.setHeader("Set-Cookie", `authToken=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
    res.json({ success: true });
  });

  app.post("/api/auth/refresh", (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    res.json({ success: true });
  });

  app.get("/api/auth/me", (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // --- DRIVERS API ---
  app.get("/api/drivers", (req, res) => {
    const db = readDb();
    res.json(db.drivers);
  });

  app.post("/api/drivers", (req, res) => {
    const db = readDb();
    const newDriver: Driver = {
      ...req.body,
      id: "D" + (db.drivers.length + 1) + "_" + Math.floor(Math.random() * 1000),
      rating: req.body.rating || 5.0,
      tripsCompleted: req.body.tripsCompleted || 0,
      safetyScore: req.body.safetyScore || 100,
    };
    db.drivers.push(newDriver);
    writeDb(db);
    res.status(201).json(newDriver);
  });

  app.put("/api/drivers/:id", (req, res) => {
    const db = readDb();
    const index = db.drivers.findIndex((d) => d.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Driver not found" });

    db.drivers[index] = { ...db.drivers[index], ...req.body };
    writeDb(db);
    res.json(db.drivers[index]);
  });

  app.delete("/api/drivers/:id", (req, res) => {
    const db = readDb();
    db.drivers = db.drivers.filter((d) => d.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- VEHICLES API ---
  app.get("/api/vehicles", (req, res) => {
    const db = readDb();
    res.json(db.vehicles);
  });

  app.post("/api/vehicles", (req, res) => {
    const db = readDb();
    const newVehicle: Vehicle = {
      ...req.body,
      id: "V" + (db.vehicles.length + 1) + "_" + Math.floor(Math.random() * 1000),
      currentMileage: Number(req.body.currentMileage) || 0,
      nextServiceKm: Number(req.body.nextServiceKm) || 10000,
    };
    db.vehicles.push(newVehicle);
    writeDb(db);
    res.status(201).json(newVehicle);
  });

  app.put("/api/vehicles/:id", (req, res) => {
    const db = readDb();
    const index = db.vehicles.findIndex((v) => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Vehicle not found" });

    db.vehicles[index] = { ...db.vehicles[index], ...req.body };
    writeDb(db);
    res.json(db.vehicles[index]);
  });

  app.delete("/api/vehicles/:id", (req, res) => {
    const db = readDb();
    db.vehicles = db.vehicles.filter((v) => v.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- TRIPS API ---
  app.get("/api/trips", (req, res) => {
    const db = readDb();
    // Hydrate vehicle reg and driver name for frontend ease of rendering
    const tripsWithData = db.trips.map((trip) => {
      const v = db.vehicles.find((vehicle) => vehicle.id === trip.vehicleId);
      const d = db.drivers.find((driver) => driver.id === trip.driverId);
      return {
        ...trip,
        vehicleReg: v ? v.registrationNumber : "Unknown",
        driverName: d ? d.name : "Unknown",
      };
    });
    res.json(tripsWithData);
  });

  app.post("/api/trips", (req, res) => {
    const db = readDb();
    const tripNum = "FT-2026-" + (1000 + db.trips.length + 1);
    const newTrip: Trip = {
      ...req.body,
      id: "T" + (db.trips.length + 1) + "_" + Math.floor(Math.random() * 1000),
      tripNumber: tripNum,
      weight: Number(req.body.weight) || 0,
      expenseAmount: Number(req.body.expenseAmount) || 0,
    };

    // Auto update driver and vehicle status
    const driverIdx = db.drivers.findIndex(d => d.id === newTrip.driverId);
    if (driverIdx !== -1 && newTrip.status === "In Transit") {
      db.drivers[driverIdx].status = "On Trip";
    }

    db.trips.push(newTrip);
    writeDb(db);
    res.status(201).json(newTrip);
  });

  app.put("/api/trips/:id", (req, res) => {
    const db = readDb();
    const index = db.trips.findIndex((t) => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Trip not found" });

    const oldStatus = db.trips[index].status;
    db.trips[index] = { ...db.trips[index], ...req.body };

    // Update driver status dynamically based on trip status shifts
    if (db.trips[index].status === "Completed" || db.trips[index].status === "Cancelled") {
      const driverIdx = db.drivers.findIndex(d => d.id === db.trips[index].driverId);
      if (driverIdx !== -1) {
        db.drivers[driverIdx].status = "Available";
        if (db.trips[index].status === "Completed" && oldStatus !== "Completed") {
          db.drivers[driverIdx].tripsCompleted += 1;
        }
      }
    } else if (db.trips[index].status === "In Transit") {
      const driverIdx = db.drivers.findIndex(d => d.id === db.trips[index].driverId);
      if (driverIdx !== -1) {
        db.drivers[driverIdx].status = "On Trip";
      }
    }

    writeDb(db);
    res.json(db.trips[index]);
  });

  app.delete("/api/trips/:id", (req, res) => {
    const db = readDb();
    db.trips = db.trips.filter((t) => t.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- MAINTENANCE API ---
  app.get("/api/maintenance", (req, res) => {
    const db = readDb();
    const maintenanceWithData = db.maintenance.map((m) => {
      const v = db.vehicles.find((vehicle) => vehicle.id === m.vehicleId);
      return {
        ...m,
        vehicleReg: v ? v.registrationNumber : "Unknown",
      };
    });
    res.json(maintenanceWithData);
  });

  app.post("/api/maintenance", (req, res) => {
    const db = readDb();
    const newMaint: Maintenance = {
      ...req.body,
      id: "M" + (db.maintenance.length + 1) + "_" + Math.floor(Math.random() * 1000),
      cost: Number(req.body.cost) || 0,
    };

    // If starting In Progress, put vehicle In Maintenance status
    if (newMaint.status === "In Progress") {
      const vIdx = db.vehicles.findIndex(v => v.id === newMaint.vehicleId);
      if (vIdx !== -1) {
        db.vehicles[vIdx].status = "In Maintenance";
      }
    }

    db.maintenance.push(newMaint);
    writeDb(db);
    res.status(201).json(newMaint);
  });

  app.put("/api/maintenance/:id", (req, res) => {
    const db = readDb();
    const index = db.maintenance.findIndex((m) => m.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Record not found" });

    db.maintenance[index] = { ...db.maintenance[index], ...req.body };

    // Update vehicle status based on maintenance completion
    const vehicleId = db.maintenance[index].vehicleId;
    const vIdx = db.vehicles.findIndex(v => v.id === vehicleId);
    if (vIdx !== -1) {
      if (db.maintenance[index].status === "Completed") {
        db.vehicles[vIdx].status = "Active";
        // simulate standard odometer update
        db.vehicles[vIdx].nextServiceKm = db.vehicles[vIdx].currentMileage + 10000;
      } else if (db.maintenance[index].status === "In Progress") {
        db.vehicles[vIdx].status = "In Maintenance";
      }
    }

    writeDb(db);
    res.json(db.maintenance[index]);
  });

  app.delete("/api/maintenance/:id", (req, res) => {
    const db = readDb();
    db.maintenance = db.maintenance.filter((m) => m.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- EXPENSES API ---
  app.get("/api/expenses", (req, res) => {
    const db = readDb();
    const expensesWithData = db.expenses.map((e) => {
      const v = db.vehicles.find((vehicle) => vehicle.id === e.vehicleId);
      const t = db.trips.find((trip) => trip.id === e.tripId);
      return {
        ...e,
        vehicleReg: v ? v.registrationNumber : "Unknown",
        tripNumber: t ? t.tripNumber : "Direct (Non-Trip)",
      };
    });
    res.json(expensesWithData);
  });

  app.post("/api/expenses", (req, res) => {
    const db = readDb();
    const newExpense: Expense = {
      ...req.body,
      id: "E" + (db.expenses.length + 1) + "_" + Math.floor(Math.random() * 1000),
      amount: Number(req.body.amount) || 0,
    };
    db.expenses.push(newExpense);
    writeDb(db);
    res.status(201).json(newExpense);
  });

  app.put("/api/expenses/:id", (req, res) => {
    const db = readDb();
    const index = db.expenses.findIndex((e) => e.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Expense not found" });

    db.expenses[index] = { ...db.expenses[index], ...req.body };
    writeDb(db);
    res.json(db.expenses[index]);
  });

  app.delete("/api/expenses/:id", (req, res) => {
    const db = readDb();
    db.expenses = db.expenses.filter((e) => e.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- PERFORMANCE API ---
  app.get("/api/performance/drivers", (req, res) => {
    const db = readDb();
    // Return sorted driver safety scores & trip metrics
    const data = db.drivers.map((d) => ({
      name: d.name,
      rating: d.rating,
      tripsCompleted: d.tripsCompleted,
      safetyScore: d.safetyScore,
      complianceRate: d.safetyScore >= 90 ? 98 : d.safetyScore >= 80 ? 91 : 82,
    }));
    res.json(data);
  });

  app.get("/api/performance/vehicles", (req, res) => {
    const db = readDb();
    // Return fuel efficiency & mileage metrics
    const data = db.vehicles.map((v) => {
      // realistic standard mileage factors
      const baseKmpl = v.type === "Heavy Truck" ? 3.2 : v.type === "Medium Truck" ? 5.5 : 8.5;
      const conditionMultiplier = v.status === "Active" ? 1.0 : 0.85;
      return {
        id: v.id,
        registrationNumber: v.registrationNumber,
        model: v.model,
        efficiencyKmpl: parseFloat((baseKmpl * conditionMultiplier).toFixed(1)),
        uptimePercentage: v.status === "Active" ? 96 : v.status === "In Maintenance" ? 82 : 65,
        totalKilometers: v.currentMileage,
      };
    });
    res.json(data);
  });

  // --- ANALYTICS API ---
  app.get("/api/analytics/fleet", (req, res) => {
    const db = readDb();
    // Calculate dashboard statistics & active charts
    const totalVehicles = db.vehicles.length;
    const activeVehicles = db.vehicles.filter((v) => v.status === "Active").length;
    const inMaintVehicles = db.vehicles.filter((v) => v.status === "In Maintenance").length;

    const totalDrivers = db.drivers.length;
    const availableDrivers = db.drivers.filter((d) => d.status === "Available").length;
    const onTripDrivers = db.drivers.filter((d) => d.status === "On Trip").length;

    const trips = db.trips;
    const activeTrips = trips.filter((t) => t.status === "In Transit").length;
    const scheduledTrips = trips.filter((t) => t.status === "Scheduled").length;
    const completedTrips = trips.filter((t) => t.status === "Completed").length;

    // Monthly volume breakdown (for charting)
    const tripVolumeTrend = [
      { month: "Feb 2026", trips: 18, tonnes: 420 },
      { month: "Mar 2026", trips: 24, tonnes: 590 },
      { month: "Apr 2026", trips: 28, tonnes: 680 },
      { month: "May 2026", trips: 35, tonnes: 810 },
      { month: "Jun 2026", trips: 42, tonnes: 980 },
      { month: "Jul 2026", trips: trips.length, tonnes: trips.reduce((sum, t) => sum + t.weight, 0) },
    ];

    res.json({
      summary: {
        vehicles: { total: totalVehicles, active: activeVehicles, maintenance: inMaintVehicles },
        drivers: { total: totalDrivers, available: availableDrivers, onTrip: onTripDrivers },
        trips: { total: trips.length, active: activeTrips, scheduled: scheduledTrips, completed: completedTrips },
      },
      tripVolumeTrend,
    });
  });

  app.get("/api/analytics/expenses", (req, res) => {
    const db = readDb();
    const expenses = db.expenses;

    // Sum totals by category
    const categoryTotals = expenses.reduce((acc: Record<string, number>, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

    const chartData = Object.keys(categoryTotals).map((cat) => ({
      category: cat,
      amount: categoryTotals[cat],
    }));

    // Cost trend (for chart)
    const costTrend = [
      { month: "Feb 2026", Fuel: 120000, Toll: 35000, Maintenance: 24000, Other: 15000 },
      { month: "Mar 2026", Fuel: 145000, Toll: 42000, Maintenance: 31000, Other: 18000 },
      { month: "Apr 2026", Fuel: 168000, Toll: 49000, Maintenance: 15000, Other: 22000 },
      { month: "May 2026", Fuel: 195000, Toll: 55000, Maintenance: 45000, Other: 28000 },
      { month: "Jun 2026", Fuel: 220000, Toll: 64000, Maintenance: 62000, Other: 30000 },
      {
        month: "Jul 2026",
        Fuel: expenses.filter(e => (e.category as any) === "Fuel").reduce((sum, e) => sum + e.amount, 0),
        Toll: expenses.filter(e => (e.category as any) === "Toll").reduce((sum, e) => sum + e.amount, 0),
        Maintenance: expenses.filter(e => (e.category as any) === "Maintenance").reduce((sum, e) => sum + e.amount, 0),
        Other: expenses.filter(e => (e.category as any) !== "Fuel" && (e.category as any) !== "Toll" && (e.category as any) !== "Maintenance").reduce((sum, e) => sum + e.amount, 0),
      },
    ];

    res.json({
      categoryTotals: chartData,
      costTrend,
      totalSpent: expenses.reduce((sum, e) => sum + e.amount, 0),
    });
  });

  // --- USERS API ---
  app.get("/api/users", (req, res) => {
    const db = readDb();
    const usersWithoutPasswords = db.users.map(({ password: _, ...u }) => u);
    res.json(usersWithoutPasswords);
  });

  app.put("/api/users/:id/role", (req, res) => {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });

    const db = readDb();
    const index = db.users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "User not found" });

    db.users[index].role = role;
    writeDb(db);

    const { password: _, ...userWithoutPassword } = db.users[index];
    res.json(userWithoutPassword);
  });

  app.delete("/api/users/:id", (req, res) => {
    const db = readDb();
    db.users = db.users.filter((u) => u.id !== req.params.id);
    writeDb(db);
    res.json({ success: true });
  });

  // --- VITE INTERFACE / STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FleetFlow Server operating on http://localhost:${PORT}`);
  });
}

startServer();
