/**
 * Email API - Main endpoints
 * 
 * GET /api/email - List emails with filtering and pagination
 * POST /api/email - Create/save draft email
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET - List emails with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const skip = (page - 1) * limit;

    // Filters
    const folder = searchParams.get("folder") || "INBOX";
    const isRead = searchParams.get("isRead");
    const isStarred = searchParams.get("isStarred");
    const isArchived = searchParams.get("isArchived");
    const labelId = searchParams.get("labelId");
    const leadId = searchParams.get("leadId");
    const threadId = searchParams.get("threadId");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {
      userId: session.user.id,
    };

    // Folder filter (special handling for virtual folders)
    if (folder === "ALL") {
      where.isTrash = false;
      where.isSpam = false;
    } else if (folder === "STARRED") {
      where.isStarred = true;
      where.isTrash = false;
    } else if (folder === "UNREAD") {
      where.isRead = false;
      where.isTrash = false;
    } else if (folder === "TRASH") {
      where.isTrash = true;
    } else if (folder === "SPAM") {
      where.isSpam = true;
    } else if (folder === "SENT") {
      where.isSent = true;
    } else if (folder === "DRAFTS") {
      where.isDraft = true;
    } else {
      where.folder = folder;
      where.isTrash = false;
      where.isSpam = false;
    }

    // Additional filters
    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true";
    }
    if (isStarred !== null && isStarred !== undefined) {
      where.isStarred = isStarred === "true";
    }
    if (isArchived !== null && isArchived !== undefined) {
      where.isArchived = isArchived === "true";
    }
    if (leadId) {
      where.leadId = leadId;
    }
    if (threadId) {
      where.threadId = threadId;
    }

    // Search filter
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { fromAddress: { contains: search, mode: "insensitive" } },
        { fromName: { contains: search, mode: "insensitive" } },
        { snippet: { contains: search, mode: "insensitive" } },
      ];
    }

    // Get emails
    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        orderBy: { receivedAt: "desc" },
        skip,
        take: limit,
        include: {
          attachments: {
            select: {
              id: true,
              filename: true,
              contentType: true,
              size: true,
              isInline: true,
            },
          },
          labels: {
            include: {
              label: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          lead: {
            select: {
              id: true,
              standardData: true,
            },
          },
        },
      }),
      prisma.email.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await prisma.email.count({
      where: {
        userId: session.user.id,
        isRead: false,
        isTrash: false,
        isSpam: false,
      },
    });

    // Transform emails
    const transformedEmails = emails.map(email => ({
      ...email,
      labels: email.labels.map(l => l.label),
    }));

    return NextResponse.json({
      emails: transformedEmails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      meta: {
        unreadCount,
        folder,
      },
    });
  } catch (error: any) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create/save draft email
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      toAddresses,
      ccAddresses,
      bccAddresses,
      bodyPlain,
      bodyHtml,
      inReplyTo,
      references,
    } = body;

    // Get user's email settings
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailSettings: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = user.emailSettings as any;
    const accountEmail = settings?.imap_user || user.email;

    // Generate message ID
    const domain = accountEmail.split("@")[1] || "local";
    const messageId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@${domain}>`;

    // Compute thread ID
    const threadId = references?.[0] || inReplyTo || messageId;

    // Create draft email
    const email = await prisma.email.create({
      data: {
        userId: session.user.id,
        accountEmail,
        messageId,
        inReplyTo,
        references: references || [],
        threadId,
        threadPosition: 0,
        subject: subject || "(No Subject)",
        fromAddress: accountEmail,
        fromName: session.user.name || undefined,
        toAddresses: toAddresses || [],
        ccAddresses: ccAddresses || undefined,
        bccAddresses: bccAddresses || undefined,
        bodyPlain,
        bodyHtml,
        snippet: bodyPlain?.slice(0, 200) || "",
        size: (bodyPlain?.length || 0) + (bodyHtml?.length || 0),
        hasAttachments: false,
        importance: "normal",
        isDraft: true,
        folder: "Drafts",
        receivedAt: new Date(),
      },
    });

    return NextResponse.json({ email }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating draft:", error);
    return NextResponse.json(
      { error: "Failed to create draft", details: error.message },
      { status: 500 }
    );
  }
}









