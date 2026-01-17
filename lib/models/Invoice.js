import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    reservationId: { type: mongoose.Schema.Types.ObjectId, ref: "Reservation", required: true },
    customerName: { type: String, required: true, trim: true },
    vehicleLabel: { type: String, trim: true }, // e.g. "Toyota Camry 2023 (ABC-123)"

    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    status: { type: String, enum: ["draft", "sent", "paid", "void"], default: "draft" },
    issuedAt: { type: Date, default: Date.now },
    paidAt: { type: Date },

    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
