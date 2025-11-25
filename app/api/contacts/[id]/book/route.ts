/**
 * Contact Booking API (CRM Side)
 * 
 * POST /api/contacts/[id]/book
 * Creates a booking with a contact
 * 
 * GET /api/contacts/[id]/book
 * Lists bookings for a contact
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contactId } = await params;
    const body = await request.json();
    const { title, description, startTime, endTime, meetingLink, location, notes } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Title, start time, and end time are required" },
        { status: 400 }
      );
    }

    // Get the contact
    const contact = await prisma.interlocuteur.findUnique({
      where: { id: contactId },
      include: {
        account: {
          select: { companyName: true },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Create the booking
    const booking = await prisma.contactBooking.create({
      data: {
        contactId,
        userId: session.user.id,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink,
        location,
        notes,
        status: "pending",
      },
      include: {
        user: {
          select: { email: true },
        },
      },
    });

    // Try to send notification email to contact
    if (contact.email) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { emailSettings: true, email: true },
        });

        if (user?.emailSettings) {
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

          const startDate = new Date(startTime);
          const endDate = new Date(endTime);

          await transporter.sendMail({
            from: settings.smtp_user,
            to: contact.email,
            subject: `Nouveau rendez-vous : ${title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 16px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
                  <h1 style="margin: 0 0 10px 0; font-size: 24px;">📅 Nouveau rendez-vous</h1>
                  <p style="margin: 0; opacity: 0.9;">Avec ${contact.account.companyName}</p>
                </div>
                
                <p>Bonjour ${contact.name},</p>
                
                <p>Un nouveau rendez-vous a été planifié avec vous :</p>
                
                <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px 0; color: #1e293b; font-size: 18px;">${title}</h2>
                  
                  <div style="margin-bottom: 12px;">
                    <strong style="color: #64748b;">📅 Date :</strong><br>
                    <span style="color: #1e293b;">
                      ${startDate.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <strong style="color: #64748b;">⏰ Heure :</strong><br>
                    <span style="color: #1e293b;">
                      ${startDate.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} - ${endDate.toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  
                  ${description ? `
                    <div style="margin-bottom: 12px;">
                      <strong style="color: #64748b;">📝 Description :</strong><br>
                      <span style="color: #1e293b;">${description}</span>
                    </div>
                  ` : ""}
                  
                  ${location ? `
                    <div style="margin-bottom: 12px;">
                      <strong style="color: #64748b;">📍 Lieu :</strong><br>
                      <span style="color: #1e293b;">${location}</span>
                    </div>
                  ` : ""}
                  
                  ${meetingLink ? `
                    <div style="margin-bottom: 12px;">
                      <strong style="color: #64748b;">🔗 Lien de la réunion :</strong><br>
                      <a href="${meetingLink}" style="color: #6366f1;">${meetingLink}</a>
                    </div>
                  ` : ""}
                  
                  <div>
                    <strong style="color: #64748b;">👤 Organisé par :</strong><br>
                    <span style="color: #1e293b;">${user.email}</span>
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #64748b;">
                  Si vous avez accès au portail client, vous pouvez y confirmer ou modifier ce rendez-vous.
                </p>
              </body>
              </html>
            `,
          });
        }
      } catch (emailError) {
        console.error("Failed to send booking notification:", emailError);
        // Don't fail the booking creation if email fails
      }
    }

    return NextResponse.json(booking);
  } catch (error: any) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: contactId } = await params;

    const bookings = await prisma.contactBooking.findMany({
      where: { contactId },
      orderBy: { startTime: "desc" },
      include: {
        user: {
          select: { email: true, avatar: true },
        },
      },
    });

    return NextResponse.json(bookings);
  } catch (error: any) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}




