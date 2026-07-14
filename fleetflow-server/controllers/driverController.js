import Driver from "../models/Driver.js";

export const createDriver = async (req, res) => {
  const { name, licenseNumber, phone } = req.body;

  if (!name || !licenseNumber || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existing = await Driver.findOne({ licenseNumber });
    if (existing) {
      return res.status(409).json({ message: "Driver already exists" });
    }

    const newDriver = await Driver.create({
      name,
      licenseNumber,
      phone,
      addedBy: req.user.userId,
    });
    return res.status(201).json(newDriver);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create driver", error: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find();
    return res.status(200).json(drivers);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch drivers", error: error.message });
  }
};

export const getDriverById = async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    return res.status(200).json(driver);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch driver", error: error.message });
  }
};

export const updateDriver = async (req, res) => {
  try {
    const updated = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: "Driver not found" });
    }
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update driver", error: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  try {
    const deleted = await Driver.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Driver not found" });
    }
    return res.status(200).json({ message: "Driver deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete driver", error: error.message });
  }
};