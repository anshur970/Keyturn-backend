import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    color: { type: String, trim: true },
    licensePlate: { type: String, required: true, trim: true, unique: true },
    mileage: { type: Number, default: 0 },
    category: { type: String, trim: true }, // e.g. "Midsize", "SUV"
    status: { type: String, enum: ["available", "rented", "maintenance"], default: "available" },
    dailyRate: { type: Number, required: true },
    features: [{ type: String }],
    nextServiceDate: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model("Vehicle", vehicleSchema);
