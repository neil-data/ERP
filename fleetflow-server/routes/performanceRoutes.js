import express from "express";
import { getDriverPerformance, getVehiclePerformance } from "../controllers/performanceController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Performance: Fleet Manager + Safety Officer per access matrix
router.get("/drivers", verifyToken, requireRole("fleet_manager", "safety_officer"), getDriverPerformance);
router.get("/vehicles", verifyToken, requireRole("fleet_manager", "safety_officer"), getVehiclePerformance);

export default router;
