/**
 * Outlook Calendar OAuth Callback
 * 
 * GET /api/contact-portal/calendar/outlook/callback
 * Handles Outlook OAuth callback
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { outlookCalendar } from "@/lib/calendar-providers";

export const runtime = "nodejs";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // Contact ID
    const error = searchParams.get("error");

    if (error) {
      console.error("Outlook OAuth error:", error);
      return NextResponse.redirect(
        `${BASE_URL}/contact-portal/calendar?error=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${BASE_URL}/contact-portal/calendar?error=missing_params`
      );
    }

    // Exchange code for tokens
    const tokens = await outlookCalendar.exchangeCode(code);

    // Calculate token expiry
    const tokenExpiry = new Date();
    tokenExpiry.setSeconds(tokenExpiry.getSeconds() + tokens.expiresIn);

    // Create or update calendar integration
    await prisma.contactCalendarIntegration.upsert({
      where: {
        contactId_provider: {
          contactId: state,
          provider: "outlook",
        },
      },
      create: {
        contactId: state,
        provider: "outlook",
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry,
        email: tokens.email,
        isActive: true,
      },
      update: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiry,
        email: tokens.email,
        isActive: true,
      },
    });

    return NextResponse.redirect(
      `${BASE_URL}/contact-portal/calendar?success=outlook`
    );
  } catch (error: any) {
    console.error("Outlook OAuth callback error:", error);
    return NextResponse.redirect(
      `${BASE_URL}/contact-portal/calendar?error=${encodeURIComponent(
        error.message || "callback_failed"
      )}`
    );
  }
}









