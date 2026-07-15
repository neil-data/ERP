import express from "express";
import {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} from "../controllers/tripController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, requireRole("fleet_manager", "dispatcher"), createTrip);
router.get("/", verifyToken, requireRole("fleet_manager", "dispatcher"), getAllTrips);
router.get("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), getTripById);
router.put("/:id", verifyToken, requireRole("fleet_manager", "dispatcher"), updateTrip);
router.delete("/:id", verifyToken, requireRole("fleet_manager"), deleteTrip);

export default router;