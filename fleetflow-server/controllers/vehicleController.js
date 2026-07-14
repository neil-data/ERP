import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";

// Create Vehicle
export const createVehicle = async (req, res) => {
  try {
    const { regNumber, type, capacityKg, assignedDriver } = req.body;

    if (!regNumber || !type || !capacityKg) {
      return res.status(400).json({
        success: false,
        message: "Registration number, type and capacity are required.",
      });
    }

    const existingVehicle = await Vehicle.findOne({ regNumber });

    if (existingVehicle) {
      return res.status(409).json({
        success: false,
        message: "Vehicle already exists.",
      });
    }

    if (assignedDriver) {
      const driver = await Driver.findById(assignedDriver);

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: "Invalid driver.",
        });
      }
    }

    const vehicle = await Vehicle.create({
      regNumber,
      type,
      capacityKg,
      assignedDriver,
      registeredBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully.",
      vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get All Vehicles
export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find()
      .populate("assignedDriver", "name licenseNumber")
      .populate("registeredBy", "name email");

    return res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Get Vehicle By ID
export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate("assignedDriver", "name licenseNumber")
      .populate("registeredBy", "name email");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Update Vehicle
export const updateVehicle = async (req, res) => {
  try {
    if (req.body.assignedDriver) {
      const driver = await Driver.findById(req.body.assignedDriver);

      if (!driver) {
        return res.status(400).json({
          success: false,
          message: "Invalid driver.",
        });
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("assignedDriver", "name licenseNumber")
      .populate("registeredBy", "name email");

    if (!updatedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// Delete Vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const deletedVehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};