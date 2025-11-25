import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "audio/webm",
  "audio/mp3",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads", "messages");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedFileName}`;
    const filePath = join(uploadsDir, fileName);

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate file URL (API route for serving files)
    const fileUrl = `/api/uploads/messages/${fileName}`;

    // Determine file type category
    let fileType = "document";
    if (file.type.startsWith("image/")) {
      fileType = "image";
    } else if (file.type === "application/pdf") {
      fileType = "pdf";
    } else if (file.type.startsWith("audio/")) {
      fileType = "audio";
    }

    // For images, we could generate thumbnails here
    // For now, we'll use the same URL
    const thumbnailUrl = fileType === "image" ? fileUrl : null;

    // Create attachment record (messageId will be set when message is created)
    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId: null, // Will be updated when message is created
        fileName: file.name,
        fileUrl,
        fileType,
        fileSize: file.size,
        thumbnailUrl,
      },
    });

    return NextResponse.json(
      {
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        thumbnailUrl: attachment.thumbnailUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

