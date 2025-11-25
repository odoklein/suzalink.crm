import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const threads = await prisma.emailThread.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        receivedAt: "desc",
      },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
      },
      take: 100,
    });

    return NextResponse.json(threads);
  } catch (error) {
    console.error("Error fetching email threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch email threads" },
      { status: 500 }
    );
  }
}

