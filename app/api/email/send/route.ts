import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { to, subject, body: emailBody, leadId } = body;

    if (!to || !subject || !emailBody) {
      return NextResponse.json(
        { error: "To, subject, and body are required" },
        { status: 400 }
      );
    }

    const result = await sendEmail(session.user.id, to, subject, emailBody, leadId);

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}

