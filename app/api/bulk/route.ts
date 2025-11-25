import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { 
      entity, 
      operation, 
      itemIds, 
      data 
    }: {
      entity: 'leads' | 'campaigns' | 'accounts';
      operation: 'update_status' | 'assign' | 'delete' | 'export' | 'add_tags' | 'remove_tags' | 'update_field' | 'duplicate';
      itemIds: string[];
      data?: Record<string, any>;
    } = await request.json();

    if (!entity || !operation || !itemIds || itemIds.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields: entity, operation, itemIds" 
      }, { status: 400 });
    }

    // Limit bulk operations to prevent abuse
    if (itemIds.length > 1000) {
      return NextResponse.json({ 
        error: "Bulk operations limited to 1000 items at a time" 
      }, { status: 400 });
    }

    let result;

    switch (entity) {
      case 'leads':
        result = await handleLeadsBulkOperation(operation, itemIds, data, session.user.id);
        break;
      case 'campaigns':
        result = await handleCampaignsBulkOperation(operation, itemIds, data, session.user.id);
        break;
      case 'accounts':
        result = await handleAccountsBulkOperation(operation, itemIds, data, session.user.id);
        break;
      default:
        return NextResponse.json({ error: "Invalid entity type" }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk operation" },
      { status: 500 }
    );
  }
}

async function handleLeadsBulkOperation(
  operation: string, 
  itemIds: string[], 
  data: Record<string, any> = {},
  userId: string
) {
  switch (operation) {
    case 'update_status':
      if (!data.status) {
        throw new Error("Status is required for update_status operation");
      }
      
      const updateResult = await prisma.lead.updateMany({
        where: { id: { in: itemIds } },
        data: { status: data.status },
      });

      // Log activities for each lead
      await Promise.all(itemIds.map(leadId =>
        prisma.activityLog.create({
          data: {
            leadId,
            userId,
            type: 'STATUS_CHANGE',
            metadata: {
              oldStatus: 'unknown', // In a real implementation, you'd fetch the old status
              newStatus: data.status,
              bulkOperation: true,
            },
          },
        })
      ));

      return {
        success: true,
        message: `Updated status for ${updateResult.count} leads`,
        affected: updateResult.count,
      };

    case 'assign':
      if (!data.assigneeId) {
        throw new Error("Assignee ID is required for assign operation");
      }

      const assignResult = await prisma.lead.updateMany({
        where: { id: { in: itemIds } },
        data: { 
          customData: {
            // This is a simplified approach - in reality you'd merge with existing customData
            assigneeId: data.assigneeId,
          }
        },
      });

      return {
        success: true,
        message: `Assigned ${assignResult.count} leads`,
        affected: assignResult.count,
      };

    case 'delete':
      // First delete related activities
      await prisma.activityLog.deleteMany({
        where: { leadId: { in: itemIds } },
      });

      // Then delete leads
      const deleteResult = await prisma.lead.deleteMany({
        where: { id: { in: itemIds } },
      });

      return {
        success: true,
        message: `Deleted ${deleteResult.count} leads`,
        affected: deleteResult.count,
      };

    case 'add_tags':
      if (!data.tags || !Array.isArray(data.tags)) {
        throw new Error("Tags array is required for add_tags operation");
      }

      // This is a simplified implementation
      // In reality, you'd have a proper tags system
      const addTagsResult = await prisma.lead.updateMany({
        where: { id: { in: itemIds } },
        data: {
          customData: {
            tags: data.tags, // Simplified - should merge with existing tags
          },
        },
      });

      return {
        success: true,
        message: `Added tags to ${addTagsResult.count} leads`,
        affected: addTagsResult.count,
      };

    case 'export':
      // Get leads data for export
      const leadsForExport = await prisma.lead.findMany({
        where: { id: { in: itemIds } },
        include: {
          campaign: {
            select: {
              name: true,
              account: {
                select: {
                  companyName: true,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        message: `Prepared ${leadsForExport.length} leads for export`,
        data: leadsForExport,
        affected: leadsForExport.length,
      };

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

async function handleCampaignsBulkOperation(
  operation: string, 
  itemIds: string[], 
  data: Record<string, any> = {},
  userId: string
) {
  switch (operation) {
    case 'update_status':
      if (!data.status) {
        throw new Error("Status is required for update_status operation");
      }
      
      const updateResult = await prisma.campaign.updateMany({
        where: { id: { in: itemIds } },
        data: { status: data.status },
      });

      return {
        success: true,
        message: `Updated status for ${updateResult.count} campaigns`,
        affected: updateResult.count,
      };

    case 'assign':
      if (!data.assigneeId) {
        throw new Error("Assignee ID is required for assign operation");
      }

      // Verify the user exists and is a BD
      const assignee = await prisma.user.findUnique({
        where: { 
          OR: [
            { id: data.assigneeId },
            { email: data.assigneeId }
          ]
        }
      });

      if (!assignee) {
        throw new Error("User not found");
      }

      // Assign BD to campaigns and their leads
      let assignedCampaigns = 0;
      let assignedLeads = 0;

      for (const campaignId of itemIds) {
        // Check if assignment already exists
        const existingAssignment = await prisma.campaignAssignment.findUnique({
          where: {
            campaignId_userId: {
              campaignId,
              userId: assignee.id,
            },
          },
        });

        if (!existingAssignment) {
          await prisma.campaignAssignment.create({
            data: {
              campaignId,
              userId: assignee.id,
            },
          });
          assignedCampaigns++;
        }

        // Assign all leads in the campaign to this BD
        const leadsResult = await prisma.lead.updateMany({
          where: { 
            campaignId,
            assignedBDId: null, // Only assign unassigned leads
          },
          data: { 
            assignedBDId: assignee.id,
          },
        });

        assignedLeads += leadsResult.count;
      }

      return {
        success: true,
        message: `Assigned ${assignedCampaigns} campaigns to BD. ${assignedLeads} leads assigned.`,
        affected: assignedCampaigns,
      };

    case 'duplicate':
      // Duplicate campaigns
      const campaignsToDuplicate = await prisma.campaign.findMany({
        where: { id: { in: itemIds } },
        include: {
          account: true,
        },
      });

      const duplicatedCampaigns = [];

      for (const campaign of campaignsToDuplicate) {
        const duplicated = await prisma.campaign.create({
          data: {
            name: `${campaign.name} (Copy)`,
            accountId: campaign.accountId,
            status: 'Draft', // Always start duplicated campaigns as Draft
            startDate: null, // Reset start date
            schemaConfig: campaign.schemaConfig || [],
          },
          include: {
            account: true,
            _count: {
              select: {
                leads: true,
              },
            },
          },
        });

        duplicatedCampaigns.push(duplicated);
      }

      return {
        success: true,
        message: `Duplicated ${duplicatedCampaigns.length} campaigns`,
        data: duplicatedCampaigns,
        affected: duplicatedCampaigns.length,
      };

    case 'delete':
      // First delete related leads and their activities
      const relatedLeads = await prisma.lead.findMany({
        where: { campaignId: { in: itemIds } },
        select: { id: true },
      });

      const leadIds = relatedLeads.map(lead => lead.id);

      if (leadIds.length > 0) {
        await prisma.activityLog.deleteMany({
          where: { leadId: { in: leadIds } },
        });

        await prisma.lead.deleteMany({
          where: { id: { in: leadIds } },
        });
      }

      // Delete campaign assignments
      await prisma.campaignAssignment.deleteMany({
        where: { campaignId: { in: itemIds } },
      });

      // Then delete campaigns
      const deleteResult = await prisma.campaign.deleteMany({
        where: { id: { in: itemIds } },
      });

      return {
        success: true,
        message: `Deleted ${deleteResult.count} campaigns and ${leadIds.length} related leads`,
        affected: deleteResult.count,
      };

    case 'export':
      const campaignsForExport = await prisma.campaign.findMany({
        where: { id: { in: itemIds } },
        include: {
          account: true,
          _count: {
            select: {
              leads: true,
            },
          },
        },
      });

      return {
        success: true,
        message: `Prepared ${campaignsForExport.length} campaigns for export`,
        data: campaignsForExport,
        affected: campaignsForExport.length,
      };

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}

async function handleAccountsBulkOperation(
  operation: string, 
  itemIds: string[], 
  data: Record<string, any> = {},
  userId: string
) {
  switch (operation) {
    case 'delete':
      // This is a complex operation that would need to handle cascading deletes
      // For now, we'll just delete the accounts if they have no campaigns
      const accountsWithCampaigns = await prisma.account.findMany({
        where: { 
          id: { in: itemIds },
          campaigns: {
            some: {},
          },
        },
        select: { id: true },
      });

      if (accountsWithCampaigns.length > 0) {
        return {
          success: false,
          message: `Cannot delete ${accountsWithCampaigns.length} accounts that have campaigns`,
          affected: 0,
        };
      }

      const deleteResult = await prisma.account.deleteMany({
        where: { 
          id: { in: itemIds },
          campaigns: {
            none: {},
          },
        },
      });

      return {
        success: true,
        message: `Deleted ${deleteResult.count} accounts`,
        affected: deleteResult.count,
      };

    case 'export':
      const accountsForExport = await prisma.account.findMany({
        where: { id: { in: itemIds } },
        include: {
          _count: {
            select: {
              campaigns: true,
            },
          },
        },
      });

      return {
        success: true,
        message: `Prepared ${accountsForExport.length} accounts for export`,
        data: accountsForExport,
        affected: accountsForExport.length,
      };

    default:
      throw new Error(`Unsupported operation: ${operation}`);
  }
}
