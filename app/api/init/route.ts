import { NextResponse } from "next/server";
import { startEmailSyncScheduler } from "@/lib/email-sync";

// Initialize email sync scheduler
let schedulerStarted = false;

export async function GET() {
  if (!schedulerStarted) {
    startEmailSyncScheduler();
    schedulerStarted = true;
  }

  return NextResponse.json({ 
    message: "Email sync scheduler initialized",
    status: "running"
  });
}

