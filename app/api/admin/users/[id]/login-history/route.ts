import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = params.id;

    // Get user to verify exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get active sessions for this user
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expires: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get current session token from request cookies if available
    const currentSessionToken = request.cookies.get("next-auth.session-token")?.value;

    // Format sessions with additional info
    const formattedSessions = sessions.map((s) => ({
      id: s.id,
      sessionToken: s.sessionToken.substring(0, 8) + "...", // Partial token for display
      createdAt: s.createdAt.toISOString(),
      expires: s.expires.toISOString(),
      ipAddress: null, // Would need to store this on session creation
      userAgent: null, // Would need to store this on session creation
      isCurrent: s.sessionToken === currentSessionToken,
    }));

    // Generate mock login history based on sessions and last login
    // In production, you would have a dedicated LoginAttempt table
    const loginHistory = [];

    // Add successful login entries based on sessions
    for (const s of sessions) {
      loginHistory.push({
        id: s.id,
        createdAt: s.createdAt.toISOString(),
        ipAddress: null,
        userAgent: null,
        location: null,
        status: "success" as const,
        device: null,
      });
    }

    // Add last login if available
    if (user.lastLoginAt) {
      const existingEntry = loginHistory.find(
        (l) => new Date(l.createdAt).getTime() === user.lastLoginAt!.getTime()
      );
      if (!existingEntry) {
        loginHistory.push({
          id: `login-${user.lastLoginAt.getTime()}`,
          createdAt: user.lastLoginAt.toISOString(),
          ipAddress: null,
          userAgent: null,
          location: null,
          status: "success" as const,
          device: null,
        });
      }
    }

    // Sort by date descending and limit to 20
    loginHistory.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const limitedHistory = loginHistory.slice(0, 20);

    // Security events - would come from an audit log table in production
    const securityEvents: any[] = [];

    // Check for password change indicator (comparing updatedAt with createdAt)
    if (user.updatedAt > user.createdAt) {
      securityEvents.push({
        id: `event-${user.updatedAt.getTime()}`,
        type: "Profil mis à jour",
        description: "Les informations du profil utilisateur ont été modifiées",
        createdAt: user.updatedAt.toISOString(),
        severity: "low",
      });
    }

    // Security status
    const securityStatus = {
      lastPasswordChange: null, // Would need password history table
      failedLoginAttempts: 0, // Would need failed attempts tracking
      accountLocked: false, // Based on failed attempts threshold
      twoFactorEnabled: false, // Would need 2FA implementation
    };

    return NextResponse.json({
      loginHistory: limitedHistory,
      sessions: formattedSessions,
      securityEvents,
      securityStatus,
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json({ error: "Failed to fetch login history" }, { status: 500 });
  }
}

