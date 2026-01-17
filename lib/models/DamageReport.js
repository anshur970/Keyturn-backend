import mongoose from "mongoose";

const damageReportSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation" },
    reportedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
    status: { type: String, enum: ["open", "in_review", "resolved"], default: "open" },

    costEstimate: { type: Number, default: 0 },
    photos: [{ type: String }], // store URLs
    occurredAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("DamageReport", damageReportSchema);
