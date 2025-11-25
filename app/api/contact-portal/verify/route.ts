/**
 * Verify Magic Link API
 * 
 * POST /api/contact-portal/verify
 * Verifies a magic link token and creates a session
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink, createPortalSession } from "@/lib/contact-portal-auth";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "contact_portal_session";
const SESSION_EXPIRY_DAYS = 7;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Verify the magic link
    const result = await verifyMagicLink(token);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Invalid token" },
        { status: 401 }
      );
    }

    // Create a new session
    const sessionToken = await createPortalSession(result.contactId!);

    // Set the session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    return NextResponse.json({
      success: true,
      contact: result.contact,
    });
  } catch (error: any) {
    console.error("Error verifying magic link:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify token" },
      { status: 500 }
    );
  }
}

// GET endpoint for checking session status
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    const { validatePortalSession } = await import("@/lib/contact-portal-auth");
    const result = await validatePortalSession(sessionToken);

    if (!result.valid) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({
      authenticated: true,
      contact: result.contact,
    });
  } catch (error: any) {
    console.error("Error checking session:", error);
    return NextResponse.json({ authenticated: false });
  }
}

// DELETE endpoint for logging out
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      const { validatePortalSession, clearPortalSession } = await import("@/lib/contact-portal-auth");
      const result = await validatePortalSession(sessionToken);
      
      if (result.valid && result.contact) {
        await clearPortalSession(result.contact.id);
      }
    }

    // Clear the cookie
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { error: error.message || "Failed to logout" },
      { status: 500 }
    );
  }
}

