/**
 * Calendar Provider Integration
 * 
 * OAuth helpers for Google Calendar and Outlook
 */

import { prisma } from "./prisma";

// OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID || "";
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET || "";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Google Calendar OAuth
export const googleCalendar = {
  getAuthUrl(contactId: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: `${BASE_URL}/api/contact-portal/calendar/google/callback`,
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events.readonly",
        "email",
        "profile",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: contactId, // Pass contact ID for callback
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
  }> {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `${BASE_URL}/api/contact-portal/calendar/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfo = await userResponse.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email: userInfo.email,
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    };
  },

  async getBusyTimes(
    accessToken: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<Array<{ start: Date; end: Date }>> {
    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/freeBusy",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeMin: timeMin.toISOString(),
          timeMax: timeMax.toISOString(),
          items: [{ id: "primary" }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch busy times");
    }

    const data = await response.json();
    const busyTimes = data.calendars?.primary?.busy || [];

    return busyTimes.map((slot: any) => ({
      start: new Date(slot.start),
      end: new Date(slot.end),
    }));
  },
};

// Outlook Calendar OAuth
export const outlookCalendar = {
  getAuthUrl(contactId: string): string {
    const params = new URLSearchParams({
      client_id: OUTLOOK_CLIENT_ID,
      redirect_uri: `${BASE_URL}/api/contact-portal/calendar/outlook/callback`,
      response_type: "code",
      scope: [
        "offline_access",
        "Calendars.Read",
        "User.Read",
      ].join(" "),
      state: contactId,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
  }> {
    const tokenResponse = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: OUTLOOK_CLIENT_ID,
          client_secret: OUTLOOK_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: `${BASE_URL}/api/contact-portal/calendar/outlook/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userResponse.ok) {
      throw new Error("Failed to get user info");
    }

    const userInfo = await userResponse.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      email: userInfo.mail || userInfo.userPrincipalName,
    };
  },

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: OUTLOOK_CLIENT_ID,
          client_secret: OUTLOOK_CLIENT_SECRET,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const tokens = await response.json();
    return {
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
    };
  },

  async getBusyTimes(
    accessToken: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<Array<{ start: Date; end: Date }>> {
    const response = await fetch(
      "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: ["me"],
          startTime: {
            dateTime: timeMin.toISOString(),
            timeZone: "UTC",
          },
          endTime: {
            dateTime: timeMax.toISOString(),
            timeZone: "UTC",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch busy times");
    }

    const data = await response.json();
    const scheduleItems = data.value?.[0]?.scheduleItems || [];

    return scheduleItems
      .filter((item: any) => item.status === "busy")
      .map((item: any) => ({
        start: new Date(item.start.dateTime),
        end: new Date(item.end.dateTime),
      }));
  },
};

/**
 * Get the calendar provider for a given integration
 */
export function getCalendarProvider(provider: string) {
  switch (provider) {
    case "google":
      return googleCalendar;
    case "outlook":
      return outlookCalendar;
    default:
      throw new Error(`Unknown calendar provider: ${provider}`);
  }
}

/**
 * Get busy times for a contact from all their calendar integrations
 */
export async function getContactBusyTimes(
  contactId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<{ start: Date; end: Date }>> {
  const integrations = await prisma.contactCalendarIntegration.findMany({
    where: { contactId, isActive: true },
  });

  const allBusyTimes: Array<{ start: Date; end: Date }> = [];

  for (const integration of integrations) {
    try {
      const provider = getCalendarProvider(integration.provider);
      
      // Check if token is expired
      if (integration.tokenExpiry && integration.tokenExpiry < new Date()) {
        // Refresh the token
        const newTokens = await provider.refreshAccessToken(integration.refreshToken!);
        
        const tokenExpiry = new Date();
        tokenExpiry.setSeconds(tokenExpiry.getSeconds() + newTokens.expiresIn);
        
        await prisma.contactCalendarIntegration.update({
          where: { id: integration.id },
          data: {
            accessToken: newTokens.accessToken,
            tokenExpiry,
          },
        });

        integration.accessToken = newTokens.accessToken;
      }

      const busyTimes = await provider.getBusyTimes(
        integration.accessToken,
        startDate,
        endDate
      );

      allBusyTimes.push(...busyTimes);
    } catch (error) {
      console.error(`Failed to fetch busy times for ${integration.provider}:`, error);
    }
  }

  return allBusyTimes;
}




