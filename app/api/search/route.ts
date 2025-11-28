import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 

export const runtime = "nodejs";
  SearchQuery, 
  SearchResult,
  buildPrismaWhere, 
  buildPrismaOrderBy,
  validateSearchQuery,
  LEAD_SEARCH_FIELDS,
  CAMPAIGN_SEARCH_FIELDS,
  ACCOUNT_SEARCH_FIELDS
} from "@/lib/search";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entity, ...searchQuery }: { entity: 'leads' | 'campaigns' | 'accounts' } & SearchQuery = await request.json();

    if (!entity) {
      return NextResponse.json({ error: "Entity type is required" }, { status: 400 });
    }

    // Get searchable fields for the entity
    let searchableFields;
    switch (entity) {
      case 'leads':
        searchableFields = LEAD_SEARCH_FIELDS;
        break;
      case 'campaigns':
        searchableFields = CAMPAIGN_SEARCH_FIELDS;
        break;
      case 'accounts':
        searchableFields = ACCOUNT_SEARCH_FIELDS;
        break;
      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    // Validate search query
    const validation = validateSearchQuery(searchQuery, searchableFields);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: "Invalid search query", 
        details: validation.errors 
      }, { status: 400 });
    }

    // Build Prisma where clause
    const where = buildPrismaWhere(
      searchQuery.filters || [], 
      searchQuery.query, 
      searchableFields
    );

    // Build Prisma orderBy clause
    const orderBy = buildPrismaOrderBy(searchQuery.sortBy, searchQuery.sortOrder);

    // Pagination
    const page = searchQuery.page || 1;
    const limit = Math.min(searchQuery.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    let results: SearchResult<any>;

    switch (entity) {
      case 'leads':
        results = await searchLeads(where, orderBy, skip, limit);
        break;
      case 'campaigns':
        results = await searchCampaigns(where, orderBy, skip, limit);
        break;
      case 'accounts':
        results = await searchAccounts(where, orderBy, skip, limit);
        break;
      default:
        throw new Error("Invalid entity type");
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}

async function searchLeads(where: any, orderBy: any, skip: number, limit: number): Promise<SearchResult<any>> {
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
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
        activities: {
          select: {
            id: true,
            type: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    }),
    prisma.lead.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page: Math.floor(skip / limit) + 1,
    limit,
    totalPages,
    hasMore: skip + limit < total,
  };
}

async function searchCampaigns(where: any, orderBy: any, skip: number, limit: number): Promise<SearchResult<any>> {
  const [items, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
          },
        },
        _count: {
          select: {
            leads: true,
          },
        },
      },
    }),
    prisma.campaign.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page: Math.floor(skip / limit) + 1,
    limit,
    totalPages,
    hasMore: skip + limit < total,
  };
}

async function searchAccounts(where: any, orderBy: any, skip: number, limit: number): Promise<SearchResult<any>> {
  const [items, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    }),
    prisma.account.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    total,
    page: Math.floor(skip / limit) + 1,
    limit,
    totalPages,
    hasMore: skip + limit < total,
  };
}
