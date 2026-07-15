import express from "express";
import { getAllUsers, getUserById, updateUserRole, deleteUser } from "../controllers/userController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// User Management: Fleet Manager only
router.get("/", verifyToken, requireRole("fleet_manager"), getAllUsers);
router.get("/:id", verifyToken, requireRole("fleet_manager"), getUserById);
router.put("/:id/role", verifyToken, requireRole("fleet_manager"), updateUserRole);
router.delete("/:id", verifyToken, requireRole("fleet_manager"), deleteUser);

export default router;