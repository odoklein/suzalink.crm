import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper to get session (throws if not authenticated)
async function getSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Helper to validate and enforce pagination limits
function validatePagination(page?: number, limit?: number) {
  const validatedPage = Math.max(1, page || 1);
  const validatedLimit = Math.min(Math.max(1, limit || 50), 100); // Min 1, Max 100, Default 50
  return { page: validatedPage, limit: validatedLimit, skip: (validatedPage - 1) * validatedLimit };
}

// Dashboard Stats
export async function getDashboardStats() {
  const session = await getSession();
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  const startOfLastWeek = new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalAccounts,
    activeCampaigns,
    totalLeads,
    qualifiedLeads,
    contactedLeads,
    recentActivities,
    monthlyLeads,
    lastMonthLeads,
    weeklyActivities,
    lastWeekActivities,
    leadsByStatus,
    campaignPerformance,
    recentDeals
  ] = await Promise.all([
    prisma.account.count().catch(() => 0),
    prisma.campaign.count({ where: { status: "Active" } }).catch(() => 0),
    prisma.lead.count().catch(() => 0),
    prisma.lead.count({ where: { status: "Qualified" } }).catch(() => 0),
    prisma.lead.count({ where: { status: "Contacted" } }).catch(() => 0),
    prisma.activityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }).catch(() => 0),
    prisma.lead.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
    prisma.lead.count({
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
    }).catch(() => 0),
    prisma.activityLog.count({ where: { createdAt: { gte: startOfWeek } } }).catch(() => 0),
    prisma.activityLog.count({
      where: { createdAt: { gte: startOfLastWeek, lt: startOfWeek } }
    }).catch(() => 0),
    prisma.lead.groupBy({ by: ['status'], _count: { id: true } }).catch(() => []),
    prisma.campaign.findMany({
      select: { id: true, name: true, status: true, _count: { select: { leads: true } } },
      take: 10,
      orderBy: { createdAt: 'desc' }
    }).catch(() => []),
    prisma.lead.findMany({
      where: { status: "Qualified" },
      select: {
        id: true,
        standardData: true,
        status: true,
        createdAt: true,
        campaign: { select: { name: true } }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    }).catch(() => [])
  ]);

  const conversionRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : "0";
  const leadsTrend = lastMonthLeads > 0 
    ? (((monthlyLeads - lastMonthLeads) / lastMonthLeads) * 100).toFixed(1) : "0";
  const activitiesTrend = lastWeekActivities > 0 
    ? (((weeklyActivities - lastWeekActivities) / lastWeekActivities) * 100).toFixed(1) : "0";

  const statusDistribution = leadsByStatus.map(item => ({
    status: item.status,
    count: item._count.id,
    percentage: totalLeads > 0 ? ((item._count.id / totalLeads) * 100).toFixed(1) : "0"
  }));

  let avgPipelineVelocity = 0;
  try {
    const pipelineVelocity = await prisma.$queryRaw`
      SELECT AVG(EXTRACT(DAY FROM (updated_at - created_at))) as avg_days
      FROM "leads"
      WHERE status = 'Qualified'
      AND created_at >= ${startOfMonth}
    ` as any[];
    avgPipelineVelocity = pipelineVelocity[0]?.avg_days 
      ? Math.round(Number(pipelineVelocity[0].avg_days)) : 0;
  } catch (error) {
    console.error("Pipeline velocity query error:", error);
  }

  return {
    overview: {
      totalAccounts,
      activeCampaigns,
      totalLeads,
      conversionRate: `${conversionRate}%`,
      trends: {
        leads: {
          current: monthlyLeads,
          previous: lastMonthLeads,
          change: `${leadsTrend}%`,
          isPositive: Number(leadsTrend) >= 0
        },
        activities: {
          current: weeklyActivities,
          previous: lastWeekActivities,
          change: `${activitiesTrend}%`,
          isPositive: Number(activitiesTrend) >= 0
        }
      }
    },
    metrics: {
      qualifiedLeads,
      contactedLeads,
      recentActivities,
      pipelineVelocity: avgPipelineVelocity
    },
    charts: {
      statusDistribution,
      campaignPerformance: campaignPerformance.map(campaign => ({
        name: campaign.name,
        leads: campaign._count.leads,
        status: campaign.status
      }))
    },
    recentDeals: recentDeals.map(lead => ({
      id: lead.id,
      name: `${lead.standardData?.firstName || ''} ${lead.standardData?.lastName || ''}`.trim() || 'Unknown',
      company: lead.standardData?.company || 'Unknown Company',
      campaign: lead.campaign?.name || 'Unknown Campaign',
      status: lead.status,
      createdAt: lead.createdAt
    }))
  };
}

// Campaigns
export async function getCampaigns(filters?: {
  accountId?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  leadCountMin?: number;
  leadCountMax?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const session = await getSession();
  
  const where: any = {};
  
  if (filters?.accountId) where.accountId = filters.accountId;
  
  if (filters?.status && filters.status.length > 0) {
    where.status = { in: filters.status };
  }
  
  if (filters?.dateFrom || filters?.dateTo) {
    where.startDate = {};
    if (filters.dateFrom) where.startDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.startDate.lte = new Date(filters.dateTo);
  }

  // For BD users, only show campaigns where they have assigned leads
  if (session.user.role === "BD") {
    const leadsAssignedToBD = await prisma.lead.findMany({
      where: { assignedBdId: session.user.id },
      select: { campaignId: true },
      distinct: ['campaignId'],
    });
    
    const campaignIdsWithAssignedLeads = leadsAssignedToBD.map((lead) => lead.campaignId);
    
    if (campaignIdsWithAssignedLeads.length === 0) {
      return [];
    }
    
    where.id = { in: campaignIdsWithAssignedLeads };
  }

  const orderBy: any = {};
  switch (filters?.sortBy) {
    case "name": orderBy.name = filters.sortOrder || "desc"; break;
    case "status": orderBy.status = filters.sortOrder || "desc"; break;
    case "startDate": orderBy.startDate = filters.sortOrder || "desc"; break;
    default: orderBy.createdAt = filters?.sortOrder || "desc";
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    orderBy,
    include: {
      account: { select: { id: true, companyName: true } },
      _count: { select: { leads: true } },
    },
  });

  let processedCampaigns = campaigns;
  
  // For BD users, recalculate lead counts
  if (session.user.role === "BD") {
    const leadCountsByCampaign = await prisma.lead.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaigns.map(c => c.id) },
        assignedBdId: session.user.id,
      },
      _count: { id: true },
    });

    const leadCountMap = new Map(
      leadCountsByCampaign.map(item => [item.campaignId, item._count.id])
    );

    processedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      _count: { leads: leadCountMap.get(campaign.id) || 0 },
    }));
  }

  // Filter by lead count range
  let filteredCampaigns = processedCampaigns;
  if (filters?.leadCountMin || filters?.leadCountMax) {
    filteredCampaigns = processedCampaigns.filter((campaign) => {
      const leadCount = campaign._count?.leads || 0;
      if (filters.leadCountMin && leadCount < filters.leadCountMin) return false;
      if (filters.leadCountMax && leadCount > filters.leadCountMax) return false;
      return true;
    });
  }

  // Sort by lead count if needed
  if (filters?.sortBy === "leadCount") {
    filteredCampaigns.sort((a, b) => {
      const aCount = a._count?.leads || 0;
      const bCount = b._count?.leads || 0;
      const order = filters.sortOrder === "asc" ? 1 : -1;
      return (aCount - bCount) * order;
    });
  }

  return filteredCampaigns;
}

export async function getCampaign(id: string) {
  const session = await getSession();
  
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
      return null;
    }
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      account: true,
      _count: { select: { leads: true } },
    },
  });

  return campaign;
}

// Leads - with strict pagination enforcement
export async function getLeads(params?: {
  campaignId?: string;
  status?: string;
  search?: string;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}) {
  const session = await getSession();
  
  // Enforce pagination limits
  const { page, limit, skip } = validatePagination(params?.page, params?.limit);

  const where: any = {};
  
  if (params?.campaignId) {
    where.campaignId = params.campaignId;
    
    // For BD users, verify they have access to this campaign and filter by assignment
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: params.campaignId,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return { leads: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      }

      // BD users only see leads assigned to them
      where.assignedBdId = session.user.id;
    }
  } else {
    // If no campaignId specified, for BD users, only show leads assigned to them
    if (session.user.role === "BD") {
      where.assignedBdId = session.user.id;
    }
  }
  
  if (params?.status) where.status = params.status;
  if (params?.assignedTo) where.assignedBdId = params.assignedTo;

  if (params?.dateFrom || params?.dateTo) {
    where.createdAt = {};
    if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
    if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
  }

  if (params?.search) {
    where.OR = [
      { standardData: { path: ["firstName"], string_contains: params.search } },
      { standardData: { path: ["lastName"], string_contains: params.search } },
      { standardData: { path: ["email"], string_contains: params.search } },
      { standardData: { path: ["phone"], string_contains: params.search } },
    ];
  }

  const orderBy: any = {};
  switch (params?.sortBy) {
    case "status": orderBy.status = params.sortOrder || "desc"; break;
    case "createdAt": orderBy.createdAt = params.sortOrder || "desc"; break;
    case "updatedAt": orderBy.updatedAt = params.sortOrder || "desc"; break;
    default: orderBy.createdAt = params?.sortOrder || "desc";
  }

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        assignedBD: { select: { id: true, email: true, avatar: true } },
        lockedByUser: { select: { id: true, email: true } },
        campaign: { select: { id: true, name: true } },
        activities: {
          select: { id: true, type: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        tasks: {
          where: { status: { in: ["pending", "in_progress"] } },
          select: { id: true, title: true, dueDate: true, type: true },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  // Apply in-memory sorting for fields that can't be sorted in database
  let sortedLeads = leads;
  if (params?.sortBy === "name" || params?.sortBy === "email" || params?.sortBy === "phone") {
    sortedLeads = [...leads].sort((a, b) => {
      const aValue = params.sortBy === "name" 
        ? `${(a.standardData as any)?.firstName || ""} ${(a.standardData as any)?.lastName || ""}`.trim().toLowerCase()
        : params.sortBy === "email"
        ? ((a.standardData as any)?.email || "").toLowerCase()
        : ((a.standardData as any)?.phone || "").toLowerCase();
      
      const bValue = params.sortBy === "name"
        ? `${(b.standardData as any)?.firstName || ""} ${(b.standardData as any)?.lastName || ""}`.trim().toLowerCase()
        : params.sortBy === "email"
        ? ((b.standardData as any)?.email || "").toLowerCase()
        : ((b.standardData as any)?.phone || "").toLowerCase();
      
      if (aValue < bValue) return params.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return params.sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }

  return {
    leads: sortedLeads,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getLead(id: string) {
  const session = await getSession();
  
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      campaign: {
        include: { account: true },
      },
      assignedBD: {
        select: { id: true, email: true },
      },
      activities: {
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: { id: true, email: true },
          },
        },
      },
    },
  });

  if (!lead) {
    return null;
  }

  // For BD users, verify they have access to this campaign
  if (session.user.role === "BD") {
    const assignment = await prisma.campaignAssignment.findUnique({
      where: {
        campaignId_userId: {
          campaignId: lead.campaignId,
          userId: session.user.id,
        },
      },
    });

    if (!assignment) {
      return null;
    }
  }

  return lead;
}

// Accounts
export async function getAccounts() {
  await getSession(); // Just check auth
  
  return prisma.account.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          campaigns: true,
          interlocuteurs: true,
        },
      },
    },
  });
}

export async function getAccount(id: string) {
  await getSession(); // Just check auth
  
  return prisma.account.findUnique({
    where: { id },
    include: {
      campaigns: {
        include: {
          _count: { select: { leads: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      interlocuteurs: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

// Email Threads
export async function getEmailThreads(limit: number = 100) {
  const session = await getSession();
  
  const validatedLimit = Math.min(Math.max(1, limit), 100);
  
  return prisma.emailThread.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      receivedAt: "desc",
    },
    include: {
      lead: {
        select: {
          id: true,
          standardData: true,
        },
      },
    },
    take: validatedLimit,
  });
}

