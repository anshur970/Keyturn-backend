// lib/prisma.js
import pkg from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const { PrismaClient } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Please configure it in your environment variables.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional: helps avoid issues on some hosted postgres setups
  // ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

const prisma =
  globalThis.prisma ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
