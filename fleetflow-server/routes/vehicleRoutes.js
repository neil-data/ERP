import express from "express";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
} from "../controllers/vehicleController.js";
import {
  verifyToken,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

// Create Vehicle
router.post(
  "/",
  verifyToken,
  requireRole("fleet_manager", "dispatcher"),
  createVehicle
);

// Get All Vehicles
router.get(
  "/",
  verifyToken,
  requireRole("fleet_manager", "dispatcher"),
  getAllVehicles
);

// Get Vehicle By ID
router.get(
  "/:id",
  verifyToken,
  requireRole("fleet_manager", "dispatcher"),
  getVehicleById
);

// Update Vehicle
router.put(
  "/:id",
  verifyToken,
  requireRole("fleet_manager", "dispatcher"),
  updateVehicle
);

// Delete Vehicle
router.delete(
  "/:id",
  verifyToken,
  requireRole("fleet_manager"),
  deleteVehicle
);

export default router;