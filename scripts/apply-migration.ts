/**
 * Script to apply the booking system redesign migration
 * Run with: npx tsx scripts/apply-migration.ts
 */

import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function applyMigration() {
  const client = await pool.connect();
  
  try {
    console.log("📦 Reading migration file...");
    const migrationPath = path.join(
      __dirname,
      "../prisma/migrations/20250101000000_booking_system_redesign/migration.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("🚀 Starting migration...");
    console.log("⚠️  This will modify your database schema. Make sure you have a backup!");
    
    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    await client.query("BEGIN");

    try {
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          console.log(`  Executing statement ${i + 1}/${statements.length}...`);
          await client.query(statement);
        }
      }

      await client.query("COMMIT");
      console.log("✅ Migration completed successfully!");
    } catch (error: any) {
      await client.query("ROLLBACK");
      console.error("❌ Migration failed, rolling back...");
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Error applying migration:", error.message);
    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

applyMigration();

