import { prisma } from "./prisma";

export interface TaskSuggestion {
  leadId: string;
  leadName: string;
  campaignName: string;
  priority: "urgent" | "high" | "medium" | "low";
  reason: string;
  suggestedAction: string;
  suggestedDueDate: Date;
  type: string; // 'call', 'email', 'follow_up', etc.
}

export async function generateTaskSuggestions(
  userId: string
): Promise<TaskSuggestion[]> {
  const suggestions: TaskSuggestion[] = [];

  // Get leads assigned to user
  const leads = await prisma.lead.findMany({
    where: {
      OR: [
        { assignedBdId: userId },
        {
          campaign: {
            assignedBDs: {
              some: {
                userId,
              },
            },
          },
        },
      ],
      status: {
        in: ["New", "Contacted", "Qualified", "Nurture"],
      },
    },
    include: {
      campaign: {
        select: {
          name: true,
        },
      },
      activities: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  const now = new Date();

  for (const lead of leads) {
    const standardData = lead.standardData as any;
    const leadName = `${standardData?.firstName || ""} ${
      standardData?.lastName || ""
    }`.trim() || "Unknown Lead";

    const lastActivity = lead.activities[0];
    const daysSinceLastActivity = lastActivity
      ? Math.floor(
          (now.getTime() - new Date(lastActivity.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : Math.floor(
          (now.getTime() - new Date(lead.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        );

    // 1. No touch in 7+ days (HIGH PRIORITY)
    if (daysSinceLastActivity >= 7) {
      const daysAgo = lastActivity
        ? daysSinceLastActivity
        : daysSinceLastActivity;

      suggestions.push({
        leadId: lead.id,
        leadName,
        campaignName: lead.campaign?.name || "Unknown Campaign",
        priority: daysSinceLastActivity >= 14 ? "urgent" : "high",
        reason: `No contact in ${daysAgo} days`,
        suggestedAction: "Re-engage with follow-up call or email",
        suggestedDueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
        type: daysSinceLastActivity >= 14 ? "call" : "follow_up",
      });
      continue; // Don't add multiple suggestions for same lead
    }

    // 2. Email sent but no reply after 3+ days
    const lastEmail = lead.activities.find((a) => a.type === "EMAIL");
    if (lastEmail) {
      const daysSinceEmail = Math.floor(
        (now.getTime() - new Date(lastEmail.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const hasReplyAfterEmail = lead.activities.some(
        (a) =>
          a.createdAt > lastEmail.createdAt &&
          (a.type === "CALL" || a.type === "EMAIL")
      );

      if (daysSinceEmail >= 3 && !hasReplyAfterEmail) {
        suggestions.push({
          leadId: lead.id,
          leadName,
          campaignName: lead.campaign?.name || "Unknown Campaign",
          priority: daysSinceEmail >= 5 ? "high" : "medium",
          reason: `Email sent ${daysSinceEmail} days ago with no response`,
          suggestedAction: "Follow up with phone call",
          suggestedDueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          type: "call",
        });
        continue;
      }
    }

    // 3. Multiple call attempts with no answer
    const callActivities = lead.activities.filter((a) => a.type === "CALL");
    const unansweredCalls = callActivities.filter(
      (call) => !call.metadata || !(call.metadata as any).answered
    );

    if (unansweredCalls.length >= 2 && standardData?.email) {
      const lastCall = callActivities[0];
      const daysSinceLastCall = Math.floor(
        (now.getTime() - new Date(lastCall.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastCall >= 1) {
        suggestions.push({
          leadId: lead.id,
          leadName,
          campaignName: lead.campaign?.name || "Unknown Campaign",
          priority: "medium",
          reason: `${unansweredCalls.length} unanswered calls`,
          suggestedAction: "Try email instead of calling",
          suggestedDueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // In 2 days
          type: "email",
        });
        continue;
      }
    }

    // 4. Qualified leads need meeting scheduling
    if (lead.status === "Qualified") {
      const hasScheduledMeeting = lead.activities.some(
        (a) =>
          a.metadata &&
          (a.metadata as any).note?.toLowerCase().includes("meeting scheduled")
      );

      if (!hasScheduledMeeting) {
        suggestions.push({
          leadId: lead.id,
          leadName,
          campaignName: lead.campaign?.name || "Unknown Campaign",
          priority: "high",
          reason: "Lead is qualified but no meeting scheduled",
          suggestedAction: "Schedule discovery call or demo",
          suggestedDueDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          type: "meeting",
        });
        continue;
      }
    }

    // 5. New leads need initial contact
    if (lead.status === "New" && lead.activities.length === 0) {
      const daysSinceCreation = Math.floor(
        (now.getTime() - new Date(lead.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation >= 1) {
        suggestions.push({
          leadId: lead.id,
          leadName,
          campaignName: lead.campaign?.name || "Unknown Campaign",
          priority: daysSinceCreation >= 3 ? "urgent" : "high",
          reason: `New lead created ${daysSinceCreation} days ago`,
          suggestedAction: "Make initial contact",
          suggestedDueDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), // In 12 hours
          type: "call",
        });
      }
    }
  }

  // Sort by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  return suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}





