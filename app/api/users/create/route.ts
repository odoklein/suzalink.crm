import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Only allow if no users exist yet (first user creation) OR if admin
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;
    
    if (!isFirstUser && (!session || session.user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, password, role = "BD", organizationId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Get or create organization
    let orgId = organizationId;
    if (!orgId) {
      const org = await prisma.organization.findFirst();
      if (!org) {
        const newOrg = await prisma.organization.create({
          data: { name: "Suzali Conseil" },
        });
        orgId = newOrg.id;
      } else {
        orgId = org.id;
      }
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: isFirstUser ? "ADMIN" : role, // First user is always admin
        organizationId: orgId,
      },
    });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

