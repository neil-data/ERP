import Trip from "../models/Trip.js";
import Maintenance from "../models/Maintenance.js";

export const getDriverPerformance = async (req, res) => {
  try {
    const stats = await Trip.aggregate([
      {
        $group: {
          _id: "$driver",
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "drivers",
          localField: "_id",
          foreignField: "_id",
          as: "driverInfo",
        },
      },
      { $unwind: "$driverInfo" },
      {
        $project: {
          driverName: "$driverInfo.name",
          licenseNumber: "$driverInfo.licenseNumber",
          totalTrips: 1,
          completedTrips: 1,
          cancelledTrips: 1,
        },
      },
    ]);

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getVehiclePerformance = async (req, res) => {
  try {
    const tripStats = await Trip.aggregate([
      { $group: { _id: "$vehicle", totalTrips: { $sum: 1 } } },
    ]);

    const maintenanceStats = await Maintenance.aggregate([
      {
        $group: {
          _id: "$vehicle",
          totalMaintenanceCost: { $sum: "$cost" },
          maintenanceCount: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({ success: true, tripStats, maintenanceStats });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};