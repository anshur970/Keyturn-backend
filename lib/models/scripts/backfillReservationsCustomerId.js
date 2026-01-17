import mongoose from "mongoose";
import Reservation from "../lib/models/Reservation.js";
import Customer from "../lib/models/Customer.js";
import dotenv from "dotenv";
dotenv.config();


async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected");

  const reservations = await Reservation.find({ customerId: { $exists: false } });
  console.log("Need backfill:", reservations.length);

  let updated = 0;
  for (const r of reservations) {
    if (!r.customerName) continue;

    const c = await Customer.findOne({ fullName: r.customerName });
    if (!c) continue;

    r.customerId = c._id;
    if (!r.customerPhone) r.customerPhone = c.phone || "";
    await r.save();
    updated++;
  }

  console.log("Updated:", updated);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
