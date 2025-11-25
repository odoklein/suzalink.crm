import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Suzali Conseil",
    },
  });

  console.log("✅ Organization created:", organization.name);

  // Create admin user
  const adminPassword = await hash("Raphael100882", 12);
  const admin = await prisma.user.upsert({
    where: { email: "hammouche@suzaliconseil.com" },
    update: {
      passwordHash: adminPassword,
      role: "ADMIN",
    },
    create: {
      email: "hammouche@suzaliconseil.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      organizationId: organization.id,
    },
  });

  console.log("✅ Admin user created:");
  console.log("   Email: hammouche@suzaliconseil.com");
  console.log("   Password: Raphael100882");
  console.log("   Role: ADMIN");
  console.log("");
  console.log("⚠️  IMPORTANT: Change the default password after first login!");

  // Create a sample manager user
  const managerPassword = await hash("manager123", 12);
  const manager = await prisma.user.upsert({
    where: { email: "antoine@suzaliconseil.com" },
    update: {
      passwordHash: managerPassword,
      role: "MANAGER",
    },
    create: {
      email: "antoine@suzaliconseil.com",
      passwordHash: managerPassword,
      role: "MANAGER",
      organizationId: organization.id,
    },
  });

  console.log("✅ Manager user created:");
  console.log("   Email: antoine@suzaliconseil.com");
  console.log("   Password: manager123");
  console.log("   Role: MANAGER");

  // Create a sample BD user
  const bdPassword = await hash("julien123", 12);
  const bd = await prisma.user.upsert({
    where: { email: "julien@suzaliconseil.com" },
    update: {
      passwordHash: bdPassword,
      role: "BD",
    },
    create: {
      email: "julien@suzaliconseil.com",
      passwordHash: bdPassword,
      role: "BD",
      organizationId: organization.id,
    },
  });

  console.log("✅ BD user created:");
  console.log("   Email: julien@suzaliconseil.com");
  console.log("   Password: julien123");
  console.log("   Role: BD");

  // Create sample accounts
  const accounts = await Promise.all([
    prisma.account.upsert({
      where: { id: "account-1" },
      update: {},
      create: {
        id: "account-1",
        companyName: "TechStart Solutions",
        contractStatus: "Active",
      },
    }),
    prisma.account.upsert({
      where: { id: "account-2" },
      update: {},
      create: {
        id: "account-2",
        companyName: "Global Innovations Inc",
        contractStatus: "Active",
      },
    }),
    prisma.account.upsert({
      where: { id: "account-3" },
      update: {},
      create: {
        id: "account-3",
        companyName: "Digital Marketing Pro",
        contractStatus: "Pending",
      },
    }),
  ]);

  console.log("✅ Sample accounts created");

  // Create sample campaigns
  const campaigns = await Promise.all([
    prisma.campaign.upsert({
      where: { id: "campaign-1" },
      update: {},
      create: {
        id: "campaign-1",
        accountId: accounts[0].id,
        name: "Q4 Tech Outreach",
        status: "Active",
        startDate: new Date("2024-10-01"),
        schemaConfig: [
          { key: "company", label: "Company", type: "text" },
          { key: "industry", label: "Industry", type: "text" },
          { key: "employees", label: "Employees", type: "number" },
          { key: "source", label: "Lead Source", type: "select", options: ["LinkedIn", "Website", "Referral"] }
        ],
      },
    }),
    prisma.campaign.upsert({
      where: { id: "campaign-2" },
      update: {},
      create: {
        id: "campaign-2",
        accountId: accounts[1].id,
        name: "Enterprise Sales Campaign",
        status: "Active",
        startDate: new Date("2024-11-01"),
        schemaConfig: [
          { key: "company", label: "Company", type: "text" },
          { key: "revenue", label: "Annual Revenue", type: "number" },
          { key: "decision_maker", label: "Decision Maker", type: "text" }
        ],
      },
    }),
    prisma.campaign.upsert({
      where: { id: "campaign-3" },
      update: {},
      create: {
        id: "campaign-3",
        accountId: accounts[2].id,
        name: "SMB Marketing Campaign",
        status: "Draft",
        schemaConfig: [
          { key: "company", label: "Company", type: "text" },
          { key: "website", label: "Website", type: "text" }
        ],
      },
    }),
  ]);

  console.log("✅ Sample campaigns created");

  // Create sample leads
  const leads = await Promise.all([
    // Campaign 1 leads
    prisma.lead.upsert({
      where: { id: "lead-1" },
      update: {},
      create: {
        id: "lead-1",
        campaignId: campaigns[0].id,
        status: "Qualified",
        assignedBdId: bd.id,
        standardData: {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@acmecorp.com",
          phone: "+1-555-0123",
          jobTitle: "CTO",
          company: "Acme Corp"
        },
        customData: {
          company: "Acme Corp",
          industry: "Technology",
          employees: 150,
          source: "LinkedIn",
          leadScore: 85,
          leadGrade: "A",
          leadPriority: "Hot"
        },
      },
    }),
    prisma.lead.upsert({
      where: { id: "lead-2" },
      update: {},
      create: {
        id: "lead-2",
        campaignId: campaigns[0].id,
        status: "Contacted",
        assignedBdId: bd.id,
        standardData: {
          firstName: "Jane",
          lastName: "Smith",
          email: "jane.smith@techstart.io",
          phone: "+1-555-0124",
          jobTitle: "VP of Sales",
          company: "TechStart"
        },
        customData: {
          company: "TechStart",
          industry: "SaaS",
          employees: 50,
          source: "Website",
          leadScore: 72,
          leadGrade: "B",
          leadPriority: "Warm"
        },
      },
    }),
    prisma.lead.upsert({
      where: { id: "lead-3" },
      update: {},
      create: {
        id: "lead-3",
        campaignId: campaigns[1].id,
        status: "New",
        standardData: {
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob.johnson@enterprise.com",
          phone: "+1-555-0125",
          jobTitle: "Director of IT",
          company: "Enterprise Solutions"
        },
        customData: {
          company: "Enterprise Solutions",
          revenue: 5000000,
          decision_maker: "Bob Johnson",
          leadScore: 45,
          leadGrade: "C",
          leadPriority: "Cold"
        },
      },
    }),
    prisma.lead.upsert({
      where: { id: "lead-4" },
      update: {},
      create: {
        id: "lead-4",
        campaignId: campaigns[1].id,
        status: "Nurture",
        assignedBdId: manager.id,
        standardData: {
          firstName: "Alice",
          lastName: "Wilson",
          email: "alice.wilson@globaltech.com",
          phone: "+1-555-0126",
          jobTitle: "CEO",
          company: "Global Tech"
        },
        customData: {
          company: "Global Tech",
          revenue: 10000000,
          decision_maker: "Alice Wilson",
          leadScore: 90,
          leadGrade: "A",
          leadPriority: "Hot"
        },
      },
    }),
    prisma.lead.upsert({
      where: { id: "lead-5" },
      update: {},
      create: {
        id: "lead-5",
        campaignId: campaigns[0].id,
        status: "Lost",
        assignedBdId: bd.id,
        standardData: {
          firstName: "Mike",
          lastName: "Davis",
          email: "mike.davis@oldtech.com",
          phone: "+1-555-0127",
          jobTitle: "IT Manager",
          company: "Old Tech Corp"
        },
        customData: {
          company: "Old Tech Corp",
          industry: "Manufacturing",
          employees: 200,
          source: "Referral",
          leadScore: 25,
          leadGrade: "D",
          leadPriority: "Cold"
        },
      },
    }),
  ]);

  console.log("✅ Sample leads created");

  // Create sample activities
  const activities = await Promise.all([
    prisma.activityLog.create({
      data: {
        leadId: leads[0].id,
        userId: bd.id,
        type: "CALL",
        metadata: {
          duration: 15,
          outcome: "Positive response, interested in demo",
          answered: true
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        leadId: leads[0].id,
        userId: bd.id,
        type: "EMAIL",
        metadata: {
          subject: "Follow-up on our conversation",
          opened: true,
          clicked: true
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        leadId: leads[1].id,
        userId: bd.id,
        type: "CALL",
        metadata: {
          duration: 8,
          outcome: "Left voicemail",
          answered: false
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        leadId: leads[1].id,
        userId: bd.id,
        type: "NOTE",
        metadata: {
          note: "Interested in Q1 implementation. Follow up in 2 weeks."
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        leadId: leads[2].id,
        userId: manager.id,
        type: "EMAIL",
        metadata: {
          subject: "Introduction to our services",
          opened: false,
          clicked: false
        },
      },
    }),
    prisma.activityLog.create({
      data: {
        leadId: leads[3].id,
        userId: manager.id,
        type: "STATUS_CHANGE",
        metadata: {
          oldStatus: "Contacted",
          newStatus: "Nurture",
          reason: "Not ready to buy, follow up in 3 months"
        },
      },
    }),
  ]);

  console.log("✅ Sample activities created");

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: bd.id,
        type: "lead_assigned",
        title: "New Lead Assigned",
        message: "You have been assigned a new lead: John Doe from Acme Corp",
        priority: "medium",
        actionUrl: "/leads/lead-1",
        actionLabel: "View Lead",
        data: {
          leadId: leads[0].id,
          leadName: "John Doe",
          company: "Acme Corp"
        }
      },
    }),
    prisma.notification.create({
      data: {
        userId: bd.id,
        type: "lead_qualified",
        title: "Lead Qualified",
        message: "Jane Smith has been qualified and is ready for follow-up",
        priority: "high",
        actionUrl: "/leads/lead-2",
        actionLabel: "Contact Lead",
        data: {
          leadId: leads[1].id,
          leadName: "Jane Smith",
          company: "TechStart"
        }
      },
    }),
    prisma.notification.create({
      data: {
        userId: manager.id,
        type: "campaign_milestone",
        title: "Campaign Milestone",
        message: "Enterprise Sales Campaign has reached 50% completion",
        priority: "medium",
        actionUrl: "/campaigns/campaign-2",
        actionLabel: "View Campaign",
        data: {
          campaignId: campaigns[1].id,
          campaignName: "Enterprise Sales Campaign",
          completion: 50
        }
      },
    }),
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: "system_alert",
        title: "System Update",
        message: "CRM system will undergo maintenance tonight at 2 AM",
        priority: "low",
        data: {
          maintenanceTime: "2024-11-21T02:00:00Z",
          estimatedDuration: "2 hours"
        }
      },
    }),
  ]);

  console.log("✅ Sample notifications created");

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: bd.id,
        leadId: leads[0].id,
        campaignId: campaigns[0].id,
        title: "Follow-up call with John Doe",
        description: "Schedule a follow-up call to discuss demo requirements",
        type: "call",
        status: "pending",
        priority: "high",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        metadata: {
          estimatedDuration: 30,
          reminderSent: false,
          notes: "Interested in Q1 implementation"
        }
      },
    }),
    prisma.task.create({
      data: {
        userId: bd.id,
        leadId: leads[1].id,
        campaignId: campaigns[0].id,
        title: "Send proposal to Jane Smith",
        description: "Prepare and send detailed proposal for TechStart implementation",
        type: "email",
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        metadata: {
          estimatedDuration: 60,
          reminderSent: true,
          notes: "Include pricing for 50 users"
        }
      },
    }),
    prisma.task.create({
      data: {
        userId: manager.id,
        leadId: leads[3].id,
        campaignId: campaigns[1].id,
        title: "Demo presentation for Alice Wilson",
        description: "Conduct product demo for Global Tech CEO",
        type: "demo",
        status: "pending",
        priority: "urgent",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        metadata: {
          estimatedDuration: 45,
          reminderSent: false,
          notes: "Focus on enterprise features and scalability"
        }
      },
    }),
    prisma.task.create({
      data: {
        userId: bd.id,
        leadId: leads[4].id,
        campaignId: campaigns[0].id,
        title: "Follow-up with Mike Davis",
        description: "Check if requirements have changed since last contact",
        type: "follow_up",
        status: "overdue",
        priority: "medium",
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago (overdue)
        metadata: {
          estimatedDuration: 15,
          reminderSent: true,
          notes: "Last contact was 2 weeks ago"
        }
      },
    }),
    prisma.task.create({
      data: {
        userId: bd.id,
        campaignId: campaigns[0].id,
        title: "Review Q4 campaign performance",
        description: "Analyze campaign metrics and prepare monthly report",
        type: "custom",
        status: "completed",
        priority: "medium",
        dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // completed 2 days ago
        metadata: {
          estimatedDuration: 120,
          actualDuration: 105,
          reminderSent: false,
          notes: "Campaign performing above expectations",
          outcome: "Report submitted to management"
        }
      },
    }),
  ]);

  console.log("✅ Sample tasks created");
  console.log("");
  console.log("🎉 Seeding completed with sample data!");
  console.log("📊 Created:");
  console.log(`   - ${accounts.length} accounts`);
  console.log(`   - ${campaigns.length} campaigns`);
  console.log(`   - ${leads.length} leads`);
  console.log(`   - ${activities.length} activities`);
  console.log(`   - ${notifications.length} notifications`);
  console.log(`   - ${tasks.length} tasks`);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

