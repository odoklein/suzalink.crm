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
    
    // For BD users, check if they're assigned to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: id,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Campaign not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Get all leads for this campaign with related data
    const leads = await prisma.lead.findMany({
      where: { campaignId: id },
      include: {
        activities: {
          orderBy: { createdAt: "desc" },
        },
        assignedBD: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Calculate lead metrics
    const totalLeads = leads.length;
    const leadsByStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contactedLeads = leads.filter(l => l.status !== "New").length;
    const qualifiedLeads = leadsByStatus["Qualified"] || 0;
    const conversionRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;

    // Calculate contact info completeness
    const leadsWithEmail = leads.filter(l => {
      const standardData = l.standardData as any;
      return standardData?.email;
    }).length;

    const leadsWithPhone = leads.filter(l => {
      const standardData = l.standardData as any;
      return standardData?.phone;
    }).length;

    // Calculate activity metrics
    const allActivities = leads.flatMap(l => l.activities);
    const activityByType = allActivities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const callsMade = activityByType["CALL"] || 0;
    const emailsSent = activityByType["EMAIL"] || 0;
    const notesLogged = activityByType["NOTE"] || 0;

    // Calculate activity trend (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentActivities = allActivities.filter(a => new Date(a.createdAt) >= sevenDaysAgo).length;
    const previousActivities = allActivities.filter(a => {
      const date = new Date(a.createdAt);
      return date >= fourteenDaysAgo && date < sevenDaysAgo;
    }).length;

    const activityTrend = previousActivities > 0 
      ? ((recentActivities - previousActivities) / previousActivities) * 100 
      : recentActivities > 0 ? 100 : 0;

    // Get meetings scheduled (if bookings table exists)
    const leadIds = leads.map(l => l.id);
    let meetingsScheduled = 0;
    if (leadIds.length > 0) {
      try {
        // Check if bookings table exists by attempting to query it
        meetingsScheduled = await prisma.booking.count({
          where: {
            leadId: { in: leadIds },
          },
        });
      } catch (error: any) {
        // If table doesn't exist (P2021) or any other error, default to 0
        if (error.code !== 'P2021') {
          console.warn("Error fetching bookings count:", error);
        }
        meetingsScheduled = 0;
      }
    }

    // Calculate BD performance
    const bdPerformance = await prisma.campaignAssignment.findMany({
      where: { campaignId: id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const bdStats = bdPerformance.map(assignment => {
      const bdLeads = leads.filter(l => l.assignedBD?.id === assignment.user.id);
      return {
        bdId: assignment.user.id,
        email: assignment.user.email,
        avatar: assignment.user.avatar,
        assignedAt: assignment.assignedAt,
        leadCount: bdLeads.length,
        qualifiedCount: bdLeads.filter(l => l.status === "Qualified").length,
      };
    });

    // Get recent activities for timeline (last 10)
    const recentActivityTimeline = await prisma.activityLog.findMany({
      where: {
        lead: {
          campaignId: id,
        },
      },
      include: {
        lead: {
          select: {
            id: true,
            standardData: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      leadMetrics: {
        total: totalLeads,
        byStatus: leadsByStatus,
        contacted: contactedLeads,
        contactedRate: totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0,
        qualified: qualifiedLeads,
        conversionRate,
        withEmail: leadsWithEmail,
        withPhone: leadsWithPhone,
        emailRate: totalLeads > 0 ? (leadsWithEmail / totalLeads) * 100 : 0,
        phoneRate: totalLeads > 0 ? (leadsWithPhone / totalLeads) * 100 : 0,
      },
      activityMetrics: {
        total: allActivities.length,
        byType: activityByType,
        callsMade,
        emailsSent,
        notesLogged,
        meetingsScheduled,
        recentActivities,
        activityTrend,
      },
      bdPerformance: bdStats,
      recentActivities: recentActivityTimeline,
    });
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}


