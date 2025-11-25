/**
 * Send Magic Link API
 * 
 * POST /api/contact-portal/send-magic-link
 * Generates and sends a magic link email to a contact
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateMagicLink } from "@/lib/contact-portal-auth";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contactId } = body;

    if (!contactId) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    // Get the contact with account info
    const contact = await prisma.interlocuteur.findUnique({
      where: { id: contactId },
      include: {
        account: {
          select: {
            id: true,
            companyName: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: "Contact does not have an email address" },
        { status: 400 }
      );
    }

    // Generate magic link
    const result = await generateMagicLink(contactId);
    if (!result) {
      return NextResponse.json(
        { error: "Failed to generate magic link" },
        { status: 500 }
      );
    }

    // Get user's email settings for sending
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailSettings: true, email: true },
    });

    // Try to send email (if email settings are configured)
    let emailSent = false;
    if (user?.emailSettings) {
      try {
        const settings = user.emailSettings as any;
        
        const transporter = nodemailer.createTransport({
          host: settings.smtp_host,
          port: settings.smtp_port || 587,
          secure: settings.smtp_port === 465,
          auth: {
            user: settings.smtp_user,
            pass: settings.smtp_password,
          },
        });

        await transporter.sendMail({
          from: settings.smtp_user,
          to: contact.email,
          subject: `Accès à votre portail - ${contact.account.companyName}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                ${contact.account.logoUrl 
                  ? `<img src="${contact.account.logoUrl}" alt="${contact.account.companyName}" style="max-height: 60px; max-width: 200px;">` 
                  : `<h2 style="color: #6366f1; margin: 0;">${contact.account.companyName}</h2>`
                }
              </div>
              
              <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0 0 10px 0; font-size: 24px;">Bienvenue, ${contact.name}!</h1>
                <p style="margin: 0; opacity: 0.9;">Accédez à votre portail client</p>
              </div>
              
              <p>Bonjour ${contact.name},</p>
              
              <p>Vous avez été invité(e) à accéder au portail client. Ce portail vous permet de :</p>
              
              <ul style="background: #f8fafc; border-radius: 8px; padding: 20px 20px 20px 40px; margin: 20px 0;">
                <li style="margin-bottom: 8px;">📅 Connecter votre calendrier</li>
                <li style="margin-bottom: 8px;">⏰ Définir vos disponibilités</li>
                <li style="margin-bottom: 8px;">🤝 Gérer vos rendez-vous</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${result.magicLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Accéder au portail
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b; text-align: center;">
                Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email.
              </p>
            </body>
            </html>
          `,
        });

        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      magicLink: result.magicLink,
      expiresAt: result.expiresAt,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
      },
    });
  } catch (error: any) {
    console.error("Error sending magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send magic link" },
      { status: 500 }
    );
  }
}


