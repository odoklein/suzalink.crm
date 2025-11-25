/**
 * Email Search API
 * 
 * GET /api/email/search - Advanced email search with full-text support
 * 
 * Supports:
 * - Full-text search across subject, body, sender
 * - Date range filtering
 * - Has attachment filter
 * - Folder filter
 * - Label filter
 * - Lead association filter
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Search operators for advanced queries
interface SearchFilters {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  hasAttachment?: boolean;
  isRead?: boolean;
  isStarred?: boolean;
  folder?: string;
  labelId?: string;
  leadId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Parse search query with operators (from:, to:, subject:, has:attachment, etc.)
function parseSearchQuery(query: string): SearchFilters {
  const filters: SearchFilters = {};
  
  // Extract operators
  const operatorPattern = /(\w+):("([^"]+)"|(\S+))/g;
  let remainingQuery = query;
  let match;

  while ((match = operatorPattern.exec(query)) !== null) {
    const operator = match[1].toLowerCase();
    const value = match[3] || match[4]; // Quoted or unquoted value
    
    switch (operator) {
      case "from":
        filters.from = value;
        break;
      case "to":
        filters.to = value;
        break;
      case "subject":
        filters.subject = value;
        break;
      case "has":
        if (value === "attachment") {
          filters.hasAttachment = true;
        }
        break;
      case "is":
        if (value === "read") filters.isRead = true;
        if (value === "unread") filters.isRead = false;
        if (value === "starred") filters.isStarred = true;
        break;
      case "in":
        filters.folder = value;
        break;
      case "label":
        filters.labelId = value;
        break;
      case "after":
      case "from_date":
        filters.dateFrom = new Date(value);
        break;
      case "before":
      case "to_date":
        filters.dateTo = new Date(value);
        break;
    }

    // Remove matched operator from query
    remainingQuery = remainingQuery.replace(match[0], "").trim();
  }

  // Remaining text is the general search query
  if (remainingQuery) {
    filters.query = remainingQuery;
  }

  return filters;
}

// GET - Search emails
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Get search parameters
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "25"), 100);
    const skip = (page - 1) * limit;

    // Additional filter parameters
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const subject = searchParams.get("subject");
    const hasAttachment = searchParams.get("hasAttachment");
    const isRead = searchParams.get("isRead");
    const isStarred = searchParams.get("isStarred");
    const folder = searchParams.get("folder");
    const labelId = searchParams.get("labelId");
    const leadId = searchParams.get("leadId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Parse query for operators
    const parsedFilters = q ? parseSearchQuery(q) : {};

    // Merge URL params with parsed query filters
    const filters: SearchFilters = {
      ...parsedFilters,
      from: from || parsedFilters.from,
      to: to || parsedFilters.to,
      subject: subject || parsedFilters.subject,
      hasAttachment: hasAttachment === "true" || parsedFilters.hasAttachment,
      isRead: isRead !== null ? isRead === "true" : parsedFilters.isRead,
      isStarred: isStarred !== null ? isStarred === "true" : parsedFilters.isStarred,
      folder: folder || parsedFilters.folder,
      labelId: labelId || parsedFilters.labelId,
      leadId: leadId || parsedFilters.leadId,
      dateFrom: dateFrom ? new Date(dateFrom) : parsedFilters.dateFrom,
      dateTo: dateTo ? new Date(dateTo) : parsedFilters.dateTo,
    };

    // Build where clause
    const where: any = {
      userId: session.user.id,
      isTrash: false,
    };

    // Text search conditions
    const textConditions: any[] = [];

    if (filters.query) {
      textConditions.push({
        OR: [
          { subject: { contains: filters.query, mode: "insensitive" } },
          { bodyPlain: { contains: filters.query, mode: "insensitive" } },
          { fromAddress: { contains: filters.query, mode: "insensitive" } },
          { fromName: { contains: filters.query, mode: "insensitive" } },
          { snippet: { contains: filters.query, mode: "insensitive" } },
        ],
      });
    }

    if (filters.from) {
      textConditions.push({
        OR: [
          { fromAddress: { contains: filters.from, mode: "insensitive" } },
          { fromName: { contains: filters.from, mode: "insensitive" } },
        ],
      });
    }

    if (filters.subject) {
      textConditions.push({
        subject: { contains: filters.subject, mode: "insensitive" },
      });
    }

    if (textConditions.length > 0) {
      where.AND = textConditions;
    }

    // Boolean filters
    if (filters.hasAttachment !== undefined) {
      where.hasAttachments = filters.hasAttachment;
    }
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    if (filters.isStarred !== undefined) {
      where.isStarred = filters.isStarred;
    }

    // Folder filter
    if (filters.folder) {
      if (filters.folder === "SPAM") {
        where.isSpam = true;
      } else if (filters.folder === "TRASH") {
        where.isTrash = true;
        delete where.isTrash; // Override default exclusion
      } else {
        where.folder = filters.folder;
      }
    }

    // Lead filter
    if (filters.leadId) {
      where.leadId = filters.leadId;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.receivedAt = {};
      if (filters.dateFrom) {
        where.receivedAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.receivedAt.lte = filters.dateTo;
      }
    }

    // Execute search
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

    // Transform results with highlighting
    const results = emails.map(email => ({
      ...email,
      labels: email.labels.map(l => l.label),
      // Add highlight information for search terms
      highlights: filters.query ? {
        subject: highlightText(email.subject, filters.query),
        snippet: highlightText(email.snippet || "", filters.query),
      } : undefined,
    }));

    return NextResponse.json({
      results,
      query: q,
      filters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("Error searching emails:", error);
    return NextResponse.json(
      { error: "Failed to search emails", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Highlight search terms in text
 */
function highlightText(text: string, query: string): string {
  if (!text || !query) return text;
  
  // Escape regex special characters
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  
  return text.replace(regex, "<mark>$1</mark>");
}




