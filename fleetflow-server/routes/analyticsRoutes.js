import express from "express";
import { getExpenseSummary, getFleetSummary } from "../controllers/analyticsController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Analytics: Fleet Manager + Financial Analyst per access matrix
router.get("/expenses", verifyToken, requireRole("fleet_manager", "financial_analyst"), getExpenseSummary);
router.get("/fleet", verifyToken, requireRole("fleet_manager", "financial_analyst"), getFleetSummary);

export default router;