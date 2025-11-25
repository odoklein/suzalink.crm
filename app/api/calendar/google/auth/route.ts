import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOAuthUrl } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authUrl = await getOAuthUrl(session.user.id);
    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("Error generating OAuth URL:", error);
    return NextResponse.json(
      { error: "Failed to generate auth URL" },
      { status: 500 }
    );
  }
}





