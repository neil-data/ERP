
import express from "express";
import {
  createDriver,
    getAllDrivers,
    getDriverById,
    updateDriver,
    deleteDriver,
} from "../controllers/driverController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
const router = express.Router();

// Per your access matrix: Drivers are fleet data tied to Vehicle Registry —
// Fleet Manager + Dispatcher scope, same as Vehicle Registry itself

router.post("/", verifyToken, requireRole("fleet_manager", "dispatcher"), createDriver);
router.get("/", verifyToken, requireRole("fleet_manager", "dispatcher"), getAllDrivers);
router.get("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), getDriverById);
router.put("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), updateDriver);
router.delete("/:id", verifyToken, requireRole("fleet_manager"), deleteDriver); // deletion restricted tighter
export default router;
