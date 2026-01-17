import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, default: "KeyTurn", trim: true },
    currency: { type: String, default: "USD", trim: true },
    taxRatePercent: { type: Number, default: 0 },
    invoicePrefix: { type: String, default: "KT", trim: true },
    supportEmail: { type: String, trim: true },
    supportPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
