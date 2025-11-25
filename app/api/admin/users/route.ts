import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            assignedLeads: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, role, password, isActive = true, sendInvite = false } = body;

    if (!email || !role) {
      return NextResponse.json(
        { error: "Email and role are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Generate password if not provided
    let passwordHash: string;
    if (password) {
      passwordHash = await hashPassword(password);
    } else {
      // Generate random password
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      passwordHash = await hashPassword(randomPassword);
    }

    // Get organization
    const organization = await prisma.organization.findFirst();
    if (!organization) {
      return NextResponse.json({ error: "No organization found" }, { status: 500 });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        isActive,
        organizationId: organization.id,
      },
    });

    // TODO: Send invite email if sendInvite is true

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}




