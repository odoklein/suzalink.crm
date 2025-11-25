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

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // Filter by role (BD, MANAGER, ADMIN, DEVELOPER)
    const excludeCurrent = searchParams.get("excludeCurrent") === "true";

    const where: any = {
      organizationId: session.user.organizationId,
    };
    if (role) {
      where.role = role;
    }
    if (excludeCurrent) {
      where.id = { not: session.user.id };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        role: true,
        avatar: true,
      },
      orderBy: { email: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

