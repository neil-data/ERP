import Trip from "../models/Trip.js";
import Vehicle from "../models/Vehicle.js";
import Driver from "../models/Driver.js";

export const createTrip = async (req, res) => {
  try {
    const { vehicle, driver, origin, destination, scheduledDeparture } = req.body;

    if (!vehicle || !driver || !origin || !destination || !scheduledDeparture) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) {
      return res.status(400).json({ success: false, message: "Invalid vehicle." });
    }

    const driverExists = await Driver.findById(driver);
    if (!driverExists) {
      return res.status(400).json({ success: false, message: "Invalid driver." });
    }

    const trip = await Trip.create({
      vehicle,
      driver,
      origin,
      destination,
      scheduledDeparture,
      dispatchedBy: req.user.userId,
    });

    return res.status(201).json({ success: true, message: "Trip created successfully.", trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getAllTrips = async (req, res) => {
  try {
    const trips = await Trip.find()
      .populate("vehicle", "regNumber type")
      .populate("driver", "name licenseNumber")
      .populate("dispatchedBy", "name email");

    return res.status(200).json({ success: true, count: trips.length, trips });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("vehicle", "regNumber type")
      .populate("driver", "name licenseNumber")
      .populate("dispatchedBy", "name email");

    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }

    return res.status(200).json({ success: true, trip });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const updateTrip = async (req, res) => {
  try {
    if (req.body.vehicle) {
      const vehicleExists = await Vehicle.findById(req.body.vehicle);
      if (!vehicleExists) {
        return res.status(400).json({ success: false, message: "Invalid vehicle." });
      }
    }

    if (req.body.driver) {
      const driverExists = await Driver.findById(req.body.driver);
      if (!driverExists) {
        return res.status(400).json({ success: false, message: "Invalid driver." });
      }
    }

    const updatedTrip = await Trip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("vehicle", "regNumber type")
      .populate("driver", "name licenseNumber")
      .populate("dispatchedBy", "name email");

    if (!updatedTrip) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }

    return res.status(200).json({ success: true, message: "Trip updated successfully.", trip: updatedTrip });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const deleteTrip = async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    if (!deletedTrip) {
      return res.status(404).json({ success: false, message: "Trip not found." });
    }
    return res.status(200).json({ success: true, message: "Trip deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};