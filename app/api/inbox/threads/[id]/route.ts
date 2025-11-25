import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // First, get the selected thread
    const selectedThread = await prisma.emailThread.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!selectedThread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Determine the thread identifier - use threadId if available, otherwise use the leadId + subject pattern
    const threadIdentifier = selectedThread.threadId || selectedThread.leadId;

    // Fetch all messages in this thread
    // Group by threadId if available, otherwise group by leadId and subject similarity
    let allThreads;
    if (selectedThread.threadId) {
      // If threadId exists, fetch all threads with the same threadId
      allThreads = await prisma.emailThread.findMany({
        where: {
          threadId: selectedThread.threadId,
          userId: session.user.id,
        },
        orderBy: {
          receivedAt: "asc",
        },
        include: {
          lead: {
            select: {
              id: true,
              standardData: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  account: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } else {
      // Fallback: group by leadId and similar subject (remove "Re:" variations)
      const baseSubject = selectedThread.subject.replace(/^(Re:|RE:|Fwd:|FWD:)\s*/i, "").trim();
      allThreads = await prisma.emailThread.findMany({
        where: {
          leadId: selectedThread.leadId,
          userId: session.user.id,
          OR: [
            { subject: { contains: baseSubject } },
            { subject: { contains: `Re: ${baseSubject}` } },
            { subject: { contains: `RE: ${baseSubject}` } },
          ],
        },
        orderBy: {
          receivedAt: "asc",
        },
        include: {
          lead: {
            select: {
              id: true,
              standardData: true,
              campaign: {
                select: {
                  id: true,
                  name: true,
                  account: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Use the first thread's lead data (they should all have the same lead)
    const leadData = allThreads[0]?.lead || null;

    // Transform threads into messages format
    const messages = allThreads.map((thread) => ({
      id: thread.id,
      fromEmail: thread.fromEmail,
      toEmail: thread.toEmail,
      subject: thread.subject,
      body: thread.body,
      receivedAt: thread.receivedAt.toISOString(),
      // Determine if outbound: if user's email is in fromEmail, they sent it
      isOutbound: session.user.email && thread.fromEmail.toLowerCase().includes(session.user.email.toLowerCase()),
    }));

    return NextResponse.json({
      id: selectedThread.id,
      subject: selectedThread.subject,
      fromEmail: selectedThread.fromEmail,
      toEmail: selectedThread.toEmail,
      receivedAt: selectedThread.receivedAt.toISOString(),
      body: selectedThread.body,
      lead: leadData,
      messages: messages,
    });
  } catch (error) {
    console.error("Error fetching email thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch email thread" },
      { status: 500 }
    );
  }
}





