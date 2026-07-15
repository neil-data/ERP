import express from "express";
import {
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  approveExpense,
  deleteExpense,
} from "../controllers/expenseController.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Trip & Expense: Fleet Manager + Financial Analyst per access matrix
router.post("/", verifyToken, requireRole("fleet_manager", "financial_analyst"), createExpense);
router.get("/", verifyToken, requireRole("fleet_manager", "financial_analyst"), getAllExpenses);
router.get("/:id", verifyToken, requireRole("fleet_manager", "financial_analyst"), getExpenseById);
router.put("/:id", verifyToken, requireRole("fleet_manager", "financial_analyst"), updateExpense);
router.patch("/:id/approve", verifyToken, requireRole("fleet_manager"), approveExpense);
router.delete("/:id", verifyToken, requireRole("fleet_manager"), deleteExpense);

export default router;