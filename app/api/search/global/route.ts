import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface GlobalSearchResult {
  id: string;
  type: "lead" | "campaign" | "account" | "task";
  title: string;
  subtitle?: string;
  status?: string;
  href: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || query.length < 2) {
      return NextResponse.json([]);
    }

    const searchTerm = `%${query}%`;
    const results: GlobalSearchResult[] = [];

    // Search Leads - using JSON field search for standardData
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          {
            standardData: {
              path: ["firstName"],
              string_contains: query,
            },
          },
          {
            standardData: {
              path: ["lastName"],
              string_contains: query,
            },
          },
          {
            standardData: {
              path: ["email"],
              string_contains: query,
            },
          },
          {
            standardData: {
              path: ["company"],
              string_contains: query,
            },
          },
        ],
      },
      take: 10,
      include: {
        campaign: {
          select: {
            name: true,
          },
        },
      },
    });

    leads.forEach((lead) => {
      const standardData = lead.standardData as any;
      const fullName = [standardData?.firstName, standardData?.lastName]
        .filter(Boolean)
        .join(" ") || "Lead sans nom";
      
      results.push({
        id: lead.id,
        type: "lead",
        title: fullName,
        subtitle: standardData?.company || lead.campaign?.name,
        status: lead.status,
        href: `/leads/${lead.id}`,
      });
    });

    // Search Campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        name: {
          contains: query,
          mode: "insensitive",
        },
      },
      take: 10,
      include: {
        account: {
          select: {
            companyName: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    });

    campaigns.forEach((campaign) => {
      results.push({
        id: campaign.id,
        type: "campaign",
        title: campaign.name,
        subtitle: `${campaign.account.companyName} • ${campaign._count.leads} leads`,
        status: campaign.status,
        href: `/campaigns/${campaign.id}`,
      });
    });

    // Search Accounts
    const accounts = await prisma.account.findMany({
      where: {
        OR: [
          {
            companyName: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            industry: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 10,
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    accounts.forEach((account) => {
      results.push({
        id: account.id,
        type: "account",
        title: account.companyName,
        subtitle: account.industry || `${account._count.campaigns} campagnes`,
        href: `/accounts/${account.id}`,
      });
    });

    // Search Tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 10,
      include: {
        lead: {
          select: {
            standardData: true,
          },
        },
      },
    });

    tasks.forEach((task) => {
      const leadData = task.lead?.standardData as any;
      const leadName = leadData
        ? [leadData.firstName, leadData.lastName].filter(Boolean).join(" ")
        : null;

      results.push({
        id: task.id,
        type: "task",
        title: task.title,
        subtitle: leadName || undefined,
        status: task.status,
        href: `/tasks?taskId=${task.id}`,
      });
    });

    // Sort results: prioritize exact matches, then by relevance
    const sortedResults = results.sort((a, b) => {
      const aExact = a.title.toLowerCase().startsWith(query.toLowerCase());
      const bExact = b.title.toLowerCase().startsWith(query.toLowerCase());
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return NextResponse.json(sortedResults);
  } catch (error) {
    console.error("Global search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

