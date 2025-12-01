import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
    const passwordHash = await hashPassword(randomPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // TODO: Send email with temporary password or reset link

    return NextResponse.json({
      success: true,
      temporaryPassword: randomPassword, // In production, don't return this - send via email
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}












