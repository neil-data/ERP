
import mongoose from "mongoose";

const driverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        licenseNumber: {
            type: String,
            required: true,
            unique: true,
        },
        phone: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["available", "on_trip", "off_duty"],
            default: "available",
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);
export default mongoose.model("Driver", driverSchema);