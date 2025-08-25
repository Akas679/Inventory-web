// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";
// import * as schema from "@shared/schema";

// // PostgreSQL database connection
// let connectionString = process.env.DATABASE_URL!;

// if (!connectionString) {
//   throw new Error("DATABASE_URL environment variable is required");
// }

// console.log("Database connection configured:", connectionString ? "✓" : "✗");

// // Configure postgres connection with Supabase-compatible SSL handling
// const isSupabase = connectionString.includes('supabase.co');
// const isProduction = process.env.NODE_ENV === 'production';

// const sql = postgres(connectionString, {
//   max: isProduction ? 10 : 1,
//   prepare: false,
//   ssl: isSupabase ? { rejectUnauthorized: false } : (isProduction ? 'require' : 'prefer'),
//   connect_timeout: 30,
//   idle_timeout: 30,
// });

// export const db = drizzle(sql, { schema });

// // Test database connection
// export async function testDatabaseConnection() {
//   try {
//     await sql`SELECT 1`;
//     console.log("Database connection successful ✓");
//     return true;
//   } catch (error) {
//     console.error("Database connection failed:", error);
//     return false;
//   }
// }


import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// PostgreSQL database connection
const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure postgres connection with minimal settings
const sql = postgres(connectionString, {
  max: 1,
  prepare: false,
});

export const db = drizzle(sql, { schema });
