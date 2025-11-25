import { prisma } from "./prisma";

const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";
const GOOGLE_OAUTH_BASE = "https://oauth2.googleapis.com/token";

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: "email" | "popup";
      minutes: number;
    }>;
  };
}

export async function getAccessToken(userId: string): Promise<string | null> {
  const integration = await prisma.calendarIntegration.findFirst({
    where: {
      userId,
      provider: "google",
      isActive: true,
    },
  });

  if (!integration) {
    return null;
  }

  // Check if token is expired
  if (integration.tokenExpiry && integration.tokenExpiry < new Date()) {
    // Refresh token
    if (!integration.refreshToken) {
      throw new Error("No refresh token available");
    }

    const refreshed = await refreshAccessToken(
      integration.refreshToken,
      userId
    );
    return refreshed;
  }

  return integration.accessToken;
}

export async function refreshAccessToken(
  refreshToken: string,
  userId: string
): Promise<string> {
  const response = await fetch(GOOGLE_OAUTH_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

  // Update stored token
  await prisma.calendarIntegration.updateMany({
    where: {
      userId,
      provider: "google",
    },
    data: {
      accessToken: data.access_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return data.access_token;
}

export async function createGoogleCalendarEvent(
  userId: string,
  event: GoogleCalendarEvent
): Promise<{ id: string; htmlLink: string }> {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    throw new Error("No Google Calendar integration found");
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create event: ${error}`);
  }

  return response.json();
}

export async function updateGoogleCalendarEvent(
  userId: string,
  eventId: string,
  event: Partial<GoogleCalendarEvent>
): Promise<{ id: string; htmlLink: string }> {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    throw new Error("No Google Calendar integration found");
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update event: ${error}`);
  }

  return response.json();
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  eventId: string
): Promise<void> {
  const accessToken = await getAccessToken(userId);
  if (!accessToken) {
    throw new Error("No Google Calendar integration found");
  }

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/primary/events/${eventId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 410) {
    // 410 = already deleted
    const error = await response.text();
    throw new Error(`Failed to delete event: ${error}`);
  }
}

export async function syncBookingToGoogleCalendar(
  bookingId: string
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      lead: {
        select: {
          standardData: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  const leadData = booking.lead?.standardData as any;
  const attendees = [];
  if (leadData?.email) {
    attendees.push({ email: leadData.email });
  }

  const event: GoogleCalendarEvent = {
    summary: booking.title,
    description: booking.description || undefined,
    start: {
      dateTime: booking.startTime.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: booking.endTime.toISOString(),
      timeZone: "UTC",
    },
    location: booking.location || undefined,
    attendees: attendees.length > 0 ? attendees : undefined,
  };

  try {
    if (booking.externalEventId && booking.externalProvider === "google") {
      // Update existing event
      await updateGoogleCalendarEvent(
        booking.userId,
        booking.externalEventId,
        event
      );
    } else {
      // Create new event
      const createdEvent = await createGoogleCalendarEvent(
        booking.userId,
        event
      );

      // Update booking with external ID
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          externalEventId: createdEvent.id,
          externalProvider: "google",
          lastSyncedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Failed to sync booking to Google Calendar:", error);
    // Don't throw - allow booking to exist even if sync fails
  }
}

export async function getOAuthUrl(userId: string): Promise<string> {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`;
  const scope = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: userId, // Pass userId to identify on callback
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleOAuthCallback(
  code: string,
  userId: string
): Promise<void> {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/calendar/google/callback`;

  const response = await fetch(GOOGLE_OAUTH_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OAuth failed: ${error}`);
  }

  const data = await response.json();

  // Get user's email from token
  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    }
  );

  const userInfo = await userInfoResponse.json();

  // Store integration
  await prisma.calendarIntegration.upsert({
    where: {
      userId_provider_email: {
        userId,
        provider: "google",
        email: userInfo.email,
      },
    },
    create: {
      userId,
      provider: "google",
      email: userInfo.email,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      isActive: true,
      syncEnabled: true,
    },
    update: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || undefined,
      tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
      isActive: true,
      lastSyncAt: new Date(),
    },
  });
}





