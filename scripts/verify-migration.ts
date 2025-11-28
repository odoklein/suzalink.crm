/**
 * Quick script to verify the migration was applied
 * Run with: npx tsx scripts/verify-migration.ts
 */

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function verifyMigration() {
  const client = await pool.connect();
  
  try {
    console.log("🔍 Verifying migration...\n");

    const checks = [
      {
        name: "lead_status_configs table",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'lead_status_configs'
        )`,
      },
      {
        name: "campaign_meeting_types table",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'campaign_meeting_types'
        )`,
      },
      {
        name: "campaign_visit_days table",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'campaign_visit_days'
        )`,
      },
      {
        name: "weekly_assignments table",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'weekly_assignments'
        )`,
      },
      {
        name: "bookings.approval_status column",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'bookings' AND column_name = 'approval_status'
        )`,
      },
      {
        name: "leads.status_id column",
        query: `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'leads' AND column_name = 'status_id'
        )`,
      },
    ];

    let allPassed = true;

    for (const check of checks) {
      const result = await client.query(check.query);
      const exists = result.rows[0].exists;
      
      if (exists) {
        console.log(`✅ ${check.name} - EXISTS`);
      } else {
        console.log(`❌ ${check.name} - MISSING`);
        allPassed = false;
      }
    }

    // Check for default statuses
    const statusCount = await client.query(
      `SELECT COUNT(*) as count FROM lead_status_configs`
    );
    console.log(`\n📊 Statuses created: ${statusCount.rows[0].count}`);

    // Check for default meeting types
    const meetingTypeCount = await client.query(
      `SELECT COUNT(*) as count FROM campaign_meeting_types`
    );
    console.log(`📊 Meeting types created: ${meetingTypeCount.rows[0].count}`);

    if (allPassed) {
      console.log("\n✅ Migration verification PASSED!");
      console.log("💡 If you still don't see changes:");
      console.log("   1. Make sure you're logged in as ADMIN or MANAGER");
      console.log("   2. Refresh the page (Ctrl+R or Cmd+R)");
      console.log("   3. Navigate to Campaign → Settings tab");
      console.log("   4. Check browser console for errors");
    } else {
      console.log("\n❌ Migration verification FAILED!");
      console.log("💡 Please run the migration first:");
      console.log("   npx tsx scripts/apply-migration.ts");
    }
  } catch (error: any) {
    console.error("❌ Error verifying migration:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyMigration();

