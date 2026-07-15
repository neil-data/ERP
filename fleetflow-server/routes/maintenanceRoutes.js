import express from "express";
import {
  createMaintenance,
  getAllMaintenance,
  getMaintenanceById,
  updateMaintenance,
  deleteMaintenance,
} from "../controllers/maintenanceController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("fleet_manager", "dispatcher"), createMaintenance);
router.get("/", verifyToken, requireRole("fleet_manager", "dispatcher"), getAllMaintenance);
router.get("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), getMaintenanceById);
router.put("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), updateMaintenance);
router.delete("/:id", verifyToken, requireRole("fleet_manager"), deleteMaintenance);

export default router;