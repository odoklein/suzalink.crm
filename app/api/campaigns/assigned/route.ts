import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // For ADMIN and MANAGER, return all campaigns
    if (session.user.role === "ADMIN" || session.user.role === "MANAGER") {
      const campaigns = await prisma.campaign.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      return NextResponse.json(campaigns);
    }

    // For BD users, return only assigned campaigns
    const assignments = await prisma.campaignAssignment.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        campaign: {
          name: "asc",
        },
      },
    });

    const campaigns = assignments.map((a) => a.campaign);
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching assigned campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch assigned campaigns" },
      { status: 500 }
    );
  }
}
