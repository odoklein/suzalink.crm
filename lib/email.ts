import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export async function sendEmail(
  userId: string,
  to: string,
  subject: string,
  body: string,
  leadId?: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.emailSettings) {
    throw new Error("User email settings not found");
  }

  const emailSettings = user.emailSettings as any;

  const transporter = nodemailer.createTransport({
    host: emailSettings.smtp_host,
    port: emailSettings.smtp_port || 587,
    secure: emailSettings.smtp_port === 465,
    auth: {
      user: emailSettings.smtp_user || emailSettings.imap_user,
      pass: emailSettings.smtp_password || emailSettings.imap_password,
    },
  });

  const mailOptions = {
    from: emailSettings.smtp_user || emailSettings.imap_user,
    to,
    subject,
    text: body,
    html: body,
  };

  const result = await transporter.sendMail(mailOptions);

  // Log activity if leadId is provided
  if (leadId) {
    await prisma.activityLog.create({
      data: {
        leadId,
        userId,
        type: "EMAIL",
        metadata: {
          to,
          subject,
          body,
          sentAt: new Date().toISOString(),
          messageId: result.messageId,
        },
      },
    });
  }

  return result;
}

