import mongoose from "mongoose";

const ratePlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Standard", "Weekend Special"
    category: { type: String, trim: true }, // optional: "SUV", "Midsize"
    baseDailyRate: { type: Number, required: true },
    weekendMultiplier: { type: Number, default: 1.0 },
    weeklyDiscountPercent: { type: Number, default: 0 }, // 0-100
    active: { type: Boolean, default: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("RatePlan", ratePlanSchema);
