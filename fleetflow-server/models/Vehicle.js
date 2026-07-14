import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    regNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    type: {
      type: String,
      enum: ["truck", "van", "car", "bike"],
      required: true,
    },

    capacityKg: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["active", "under_maintenance", "inactive"],
      default: "active",
    },

    assignedDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver", 
      default: null,
    },

    registeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Vehicle", vehicleSchema);