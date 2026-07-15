import Maintenance from "../models/Maintenance.js";
import Vehicle from "../models/Vehicle.js";

export const createMaintenance = async (req, res) => {
  try {
    const { vehicle, type, cost, date } = req.body;

    if (!vehicle || !type || cost === undefined) {
      return res.status(400).json({ success: false, message: "Vehicle, type and cost are required." });
    }

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(400).json({ success: false, message: "Invalid vehicle." });
    }

    const record = await Maintenance.create({
      ...req.body,
      loggedBy: req.user.userId,
    });

    return res.status(201).json({ success: true, message: "Maintenance record created.", record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllMaintenance = async (req, res) => {
  try {
    const records = await Maintenance.find()
      .populate("vehicle", "regNumber type")
      .populate("loggedBy", "name email");

    return res.status(200).json({ success: true, count: records.length, records });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getMaintenanceById = async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id)
      .populate("vehicle", "regNumber type")
      .populate("loggedBy", "name email");

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    return res.status(200).json({ success: true, record });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const updateMaintenance = async (req, res) => {
  try {
    if (req.body.vehicle) {
      const vehicleExists = await Vehicle.findById(req.body.vehicle);
      if (!vehicleExists) {
        return res.status(400).json({ success: false, message: "Invalid vehicle." });
      }
    }

    const updated = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("vehicle", "regNumber type")
      .populate("loggedBy", "name email");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    return res.status(200).json({ success: true, message: "Record updated.", record: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteMaintenance = async (req, res) => {
  try {
    const deleted = await Maintenance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }
    return res.status(200).json({ success: true, message: "Record deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};