import Expense from "../models/Expense.js";
import Vehicle from "../models/Vehicle.js";

export const getExpenseSummary = async (req, res) => {
  try {
    const byCategory = await Expense.aggregate([
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    const overall = await Expense.aggregate([
      { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
    ]);

    return res.status(200).json({
      success: true,
      byCategory,
      totalSpent: overall[0]?.totalSpent || 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getFleetSummary = async (req, res) => {
  try {
    const byStatus = await Vehicle.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const byType = await Vehicle.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({ success: true, byStatus, byType });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};