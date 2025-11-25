import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;

    const file = await prisma.accountFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Only uploader, ADMIN, or MANAGER can delete
    if (
      file.uploadedBy !== session.user.id &&
      !["ADMIN", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete file from filesystem
    try {
      const filepath = path.join(process.cwd(), file.fileUrl);
      await unlink(filepath);
    } catch (fsError) {
      console.error("Error deleting file from filesystem:", fsError);
      // Continue even if file doesn't exist on disk
    }

    // Delete from database
    await prisma.accountFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = await params;
    const body = await request.json();

    const file = await prisma.accountFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Only uploader, ADMIN, or MANAGER can update
    if (
      file.uploadedBy !== session.user.id &&
      !["ADMIN", "MANAGER"].includes(session.user.role)
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic;
    if (body.category !== undefined) updateData.category = body.category;

    const updatedFile = await prisma.accountFile.update({
      where: { id: fileId },
      data: updateData,
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json(
      { error: "Failed to update file" },
      { status: 500 }
    );
  }
}





