import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // Filter by activity type
    const leadId = searchParams.get('leadId'); // Filter by lead

    // Build where clause
    const where: any = {};
    
    if (type) {
      where.type = type;
    }
    
    if (leadId) {
      where.leadId = leadId;
    }

    // Fetch activities from database
    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
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
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Transform to match expected format
    const transformedActivities = activities.map(activity => {
      const leadName = activity.lead?.standardData?.firstName && activity.lead?.standardData?.lastName
        ? `${activity.lead.standardData.firstName} ${activity.lead.standardData.lastName}`
        : 'Unknown Lead';

      return {
        id: activity.id,
        type: activity.type.toLowerCase(),
        title: getActivityTitle(activity.type, leadName, activity.metadata),
        description: getActivityDescription(activity.type, activity.metadata),
        timestamp: activity.createdAt.toISOString(),
        user: {
          id: activity.user.id,
          name: activity.user.email.split('@')[0],
          email: activity.user.email,
          role: activity.user.role,
        },
        target: activity.lead ? {
          id: activity.lead.id,
          type: 'lead',
          name: leadName,
          company: activity.lead.standardData?.company || activity.lead.campaign?.account.companyName || '',
          campaign: activity.lead.campaign ? {
            id: activity.lead.campaign.id,
            name: activity.lead.campaign.name,
          } : null,
        } : null,
        metadata: activity.metadata,
      };
    });

    return NextResponse.json({
      activities: transformedActivities,
      total: transformedActivities.length,
      hasMore: transformedActivities.length === limit,
    });
  } catch (error) {
    console.error("Activity feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity feed" },
      { status: 500 }
    );
  }
}

function getActivityTitle(type: string, leadName: string, metadata: any): string {
  switch (type) {
    case 'CALL':
      return `Called ${leadName}`;
    case 'EMAIL':
      return `Emailed ${leadName}`;
    case 'NOTE':
      return `Added note for ${leadName}`;
    case 'STATUS_CHANGE':
      return `Updated status for ${leadName}`;
    default:
      return `Activity with ${leadName}`;
  }
}

function getActivityDescription(type: string, metadata: any): string {
  switch (type) {
    case 'CALL':
      if (metadata?.answered) {
        return `Call duration: ${metadata.duration || 0} minutes. ${metadata.outcome || ''}`;
      } else {
        return `Left voicemail. ${metadata.outcome || ''}`;
      }
    case 'EMAIL':
      const subject = metadata?.subject || 'No subject';
      const status = [];
      if (metadata?.opened) status.push('opened');
      if (metadata?.clicked) status.push('clicked');
      return `Subject: "${subject}"${status.length ? ` (${status.join(', ')})` : ''}`;
    case 'NOTE':
      return metadata?.note || 'Added a note';
    case 'STATUS_CHANGE':
      return `Changed from ${metadata?.oldStatus || 'unknown'} to ${metadata?.newStatus || 'unknown'}${metadata?.reason ? `. Reason: ${metadata.reason}` : ''}`;
    default:
      return 'Activity completed';
  }
}
