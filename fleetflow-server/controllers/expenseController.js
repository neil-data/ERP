import Expense from "../models/Expense.js";
import Trip from "../models/Trip.js";

export const createExpense = async (req, res) => {
  try {
    const { trip, category, amount } = req.body;

    if (!trip || !category || amount === undefined) {
      return res.status(400).json({ success: false, message: "Trip, category and amount are required." });
    }

    const tripExists = await Trip.findById(trip);
    if (!tripExists) {
      return res.status(400).json({ success: false, message: "Invalid trip." });
    }

    const expense = await Expense.create({
      ...req.body,
      addedBy: req.user.userId,
    });

    return res.status(201).json({ success: true, message: "Expense created.", expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("trip", "origin destination")
      .populate("addedBy", "name email")
      .populate("approvedBy", "name email");

    return res.status(200).json({ success: true, count: expenses.length, expenses });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("trip", "origin destination")
      .populate("addedBy", "name email")
      .populate("approvedBy", "name email");

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }
    return res.status(200).json({ success: true, expense });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("trip", "origin destination")
      .populate("addedBy", "name email")
      .populate("approvedBy", "name email");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }
    return res.status(200).json({ success: true, message: "Expense updated.", expense: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const approveExpense = async (req, res) => {
  try {
    const updated = await Expense.findByIdAndUpdate(
      req.params.id,
      { approvedBy: req.user.userId },
      { new: true }
    ).populate("approvedBy", "name email");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }
    return res.status(200).json({ success: true, message: "Expense approved.", expense: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Expense not found." });
    }
    return res.status(200).json({ success: true, message: "Expense deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};