import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },

    // ✅ Proper reference to Customer
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },

    // ✅ Keep for display/history (snapshot)
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);
