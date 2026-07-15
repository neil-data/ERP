import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    type: {
      type: String,
      enum: ["oil_change", "tire_replacement", "general_service", "repair", "inspection"],
      required: true,
    },
    description: { type: String, default: "" },
    cost: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    nextDueDate: { type: Date, default: null },
    performedBy: { type: String, default: "" }, // workshop/mechanic name
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Maintenance", maintenanceSchema);