import Imap from "imap";
import { simpleParser } from "mailparser";
import { prisma } from "./prisma";

export async function syncUserEmails(userId: string): Promise<{
  success: boolean;
  processed: number;
  reason?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.emailSettings) {
    return { success: false, processed: 0, reason: "User not found or no email settings" };
  }

  const emailSettings = user.emailSettings as any;

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: emailSettings.imap_user,
      password: emailSettings.imap_password,
      host: emailSettings.imap_host,
      port: emailSettings.imap_port || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        // Search for unseen emails
        imap.search(["UNSEEN"], (err, results) => {
          if (err) {
            imap.end();
            return reject(err);
          }

          if (!results || results.length === 0) {
            imap.end();
            return resolve({ success: true, processed: 0 });
          }

          const fetch = imap.fetch(results, { bodies: "" });
          let processed = 0;

          fetch.on("message", (msg, seqno) => {
            msg.on("body", (stream) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error("Error parsing email:", err);
                  return;
                }

                const fromEmail = parsed.from?.text || "";
                const toEmail = parsed.to?.text || "";
                const subject = parsed.subject || "";
                const text = parsed.text || "";
                const html = parsed.html || "";

                // Find lead by email
                const leads = await prisma.lead.findMany({
                  where: {
                    standardData: {
                      path: ["email"],
                      equals: fromEmail.split("<")[1]?.split(">")[0] || fromEmail,
                    },
                  },
                  take: 1,
                });

                if (leads.length > 0) {
                  const lead = leads[0];

                  // Create activity log
                  await prisma.activityLog.create({
                    data: {
                      leadId: lead.id,
                      userId: user.id,
                      type: "EMAIL",
                      metadata: {
                        from: fromEmail,
                        to: toEmail,
                        subject,
                        body: text || html,
                        receivedAt: parsed.date?.toISOString(),
                      },
                    },
                  });

                  // Store in email thread
                  await prisma.emailThread.create({
                    data: {
                      leadId: lead.id,
                      userId: user.id,
                      subject,
                      body: text || html,
                      fromEmail,
                      toEmail,
                      receivedAt: parsed.date || new Date(),
                      threadId: parsed.messageId || undefined,
                    },
                  });

                  processed++;
                }
              });
            });
          });

          fetch.once("end", () => {
            // Mark emails as read
            imap.setFlags(results, ["\\Seen"], (err) => {
              if (err) console.error("Error marking emails as read:", err);
              imap.end();
              resolve({ success: true, processed });
            });
          });
        });
      });
    });

    imap.once("error", (err) => {
      console.error("IMAP error:", err);
      reject(err);
    });

    imap.connect();
  });
}

// Schedule email sync for all users
let schedulerInterval: NodeJS.Timeout | null = null;

export function startEmailSyncScheduler() {
  // Prevent multiple schedulers
  if (schedulerInterval) {
    console.log("Email sync scheduler already running");
    return;
  }

  console.log("Starting email sync scheduler (runs every 3 minutes)");
  
  schedulerInterval = setInterval(async () => {
    try {
      const users = await prisma.user.findMany({
        where: {
          emailSettings: {
            not: null,
          },
        },
      });

      for (const user of users) {
        try {
          await syncUserEmails(user.id);
        } catch (error) {
          console.error(`Error syncing emails for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in email sync scheduler:", error);
    }
  }, 3 * 60 * 1000); // 3 minutes
}

export function stopEmailSyncScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Email sync scheduler stopped");
  }
}

