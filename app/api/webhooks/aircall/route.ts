import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, resource } = body;

    // Aircall webhook events: call.created, call.answered, call.ended, etc.
    if (event === "call.ended" || event === "call.hungup") {
      const call = resource;

      // Find lead by phone number
      const phoneNumber = call.direction === "inbound" ? call.number : call.dialed_number;

      if (phoneNumber) {
        // Search for lead with matching phone number
        const leads = await prisma.lead.findMany({
          where: {
            standardData: {
              path: ["phone"],
              string_contains: phoneNumber.replace(/\D/g, ""), // Remove non-digits for matching
            },
          },
          take: 1,
        });

        if (leads.length > 0) {
          const lead = leads[0];

          // Find user by Aircall user ID (you'll need to store this mapping)
          // For now, we'll use the first available user or a default
          const users = await prisma.user.findMany({ take: 1 });
          const userId = users[0]?.id;

          if (userId) {
            await prisma.activityLog.create({
              data: {
                leadId: lead.id,
                userId,
                type: "CALL",
                metadata: {
                  direction: call.direction,
                  duration: call.duration,
                  status: call.status,
                  recordingUrl: call.recording_url,
                  startedAt: call.started_at,
                  endedAt: call.ended_at,
                  aircallCallId: call.id,
                },
              },
            });

            // Update lead status if needed
            if (call.status === "answered" && lead.status === "New") {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { status: "Contacted" },
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Aircall webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Aircall requires GET for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok" });
}

