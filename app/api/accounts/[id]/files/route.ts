import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const files = await prisma.accountFile.findMany({
      where: { accountId: id },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN and MANAGER can upload files
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: accountId } = await params;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const description = formData.get("description") as string;
    const isPublic = formData.get("isPublic") === "true";
    const category = (formData.get("category") as string) || "general";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 50MB)" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), "uploads", "accounts", accountId);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${sanitizedFilename}`;
    const filepath = path.join(uploadsDir, filename);

    // Write file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Store file metadata in database
    const fileRecord = await prisma.accountFile.create({
      data: {
        accountId,
        uploadedBy: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: `/uploads/accounts/${accountId}/${filename}`,
        description: description || null,
        isPublic,
        category,
      },
      include: {
        uploader: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}





