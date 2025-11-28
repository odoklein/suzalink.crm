import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; availabilityId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contactId, availabilityId } = await params;

    // Verify contact exists and user has access
    const contact = await prisma.interlocuteur.findUnique({
      where: { id: contactId },
      include: {
        account: {
          include: {
            assignedBDs: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check access
    if (session.user.role === "BD" && contact.account.assignedBDs.length === 0) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.contactAvailability.delete({
      where: { id: availabilityId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact availability:", error);
    return NextResponse.json(
      { error: "Failed to delete availability" },
      { status: 500 }
    );
  }
}

