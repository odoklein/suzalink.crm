import { NextRequest, NextResponse } from "next/server";
import { startEmailSyncScheduler } from "@/lib/email-sync";

// Initialize email sync scheduler on first request
let schedulerStarted = false;

export async function GET(request: NextRequest) {
  // Simple cron endpoint - can be called by external cron service
  // or initialize scheduler on first call
  if (!schedulerStarted) {
    startEmailSyncScheduler();
    schedulerStarted = true;
    console.log("✅ Email sync scheduler started");
  }

  return NextResponse.json({ message: "Email sync scheduler is running" });
}

