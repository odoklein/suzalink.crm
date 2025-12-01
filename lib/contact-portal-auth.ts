/**
 * Contact Portal Authentication
 * 
 * Magic link authentication system for contact portal access.
 * Generates unique tokens, verifies them, and manages portal sessions.
 */

import { prisma } from "./prisma";
import crypto from "crypto";
import { cookies } from "next/headers";

// Token configuration
const TOKEN_LENGTH = 64;
const TOKEN_EXPIRY_HOURS = 24;
const SESSION_COOKIE_NAME = "contact_portal_session";
const SESSION_EXPIRY_DAYS = 7;

/**
 * Generate a secure random token
 */
export function generateToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH / 2).toString("hex");
}

/**
 * Generate a magic link token for a contact
 */
export async function generateMagicLink(contactId: string): Promise<{
  token: string;
  expiresAt: Date;
  magicLink: string;
} | null> {
  const contact = await prisma.interlocuteur.findUnique({
    where: { id: contactId },
    include: { account: true },
  });

  if (!contact || !contact.email) {
    return null;
  }

  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

  // Update contact with new token
  await prisma.interlocuteur.update({
    where: { id: contactId },
    data: {
      portalEnabled: true,
      portalToken: token,
      portalTokenExpiry: expiresAt,
    },
  });

  // Build the magic link URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const magicLink = `${baseUrl}/contact-portal/${token}`;

  return {
    token,
    expiresAt,
    magicLink,
  };
}

/**
 * Verify a magic link token and create a session
 */
export async function verifyMagicLink(token: string): Promise<{
  success: boolean;
  contactId?: string;
  contact?: {
    id: string;
    name: string;
    email: string;
    account: {
      id: string;
      companyName: string;
      logoUrl: string | null;
    };
  };
  error?: string;
}> {
  const contact = await prisma.interlocuteur.findUnique({
    where: { portalToken: token },
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
    return { success: false, error: "Invalid or expired link" };
  }

  if (!contact.portalEnabled) {
    return { success: false, error: "Portal access is disabled" };
  }

  if (!contact.portalTokenExpiry || contact.portalTokenExpiry < new Date()) {
    return { success: false, error: "Link has expired" };
  }

  // Update last access and clear the single-use token
  await prisma.interlocuteur.update({
    where: { id: contact.id },
    data: {
      lastPortalAccess: new Date(),
      portalToken: null, // Single-use token
      portalTokenExpiry: null,
    },
  });

  return {
    success: true,
    contactId: contact.id,
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email!,
      account: contact.account,
    },
  };
}

/**
 * Create a portal session cookie
 */
export async function createPortalSession(contactId: string): Promise<string> {
  const sessionToken = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  // Store session in the contact record (we could also use a separate sessions table)
  await prisma.interlocuteur.update({
    where: { id: contactId },
    data: {
      portalToken: sessionToken,
      portalTokenExpiry: expiresAt,
    },
  });

  return sessionToken;
}

/**
 * Validate a portal session
 */
export async function validatePortalSession(sessionToken: string): Promise<{
  valid: boolean;
  contact?: {
    id: string;
    name: string;
    email: string;
    accountId: string;
    account: {
      id: string;
      companyName: string;
      logoUrl: string | null;
    };
  };
}> {
  if (!sessionToken) {
    return { valid: false };
  }

  const contact = await prisma.interlocuteur.findUnique({
    where: { portalToken: sessionToken },
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

  if (!contact || !contact.portalEnabled) {
    return { valid: false };
  }

  if (!contact.portalTokenExpiry || contact.portalTokenExpiry < new Date()) {
    return { valid: false };
  }

  return {
    valid: true,
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email!,
      accountId: contact.accountId,
      account: contact.account,
    },
  };
}

/**
 * Get the current portal session from cookies
 */
export async function getPortalSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }

  const result = await validatePortalSession(sessionToken);
  return result.valid ? result.contact : null;
}

/**
 * Clear the portal session
 */
export async function clearPortalSession(contactId: string): Promise<void> {
  await prisma.interlocuteur.update({
    where: { id: contactId },
    data: {
      portalToken: null,
      portalTokenExpiry: null,
    },
  });
}

/**
 * Check if a contact has portal access enabled
 */
export async function hasPortalAccess(contactId: string): Promise<boolean> {
  const contact = await prisma.interlocuteur.findUnique({
    where: { id: contactId },
    select: { portalEnabled: true, email: true },
  });

  return !!contact?.portalEnabled && !!contact?.email;
}

/**
 * Enable portal access for a contact
 */
export async function enablePortalAccess(contactId: string): Promise<boolean> {
  const contact = await prisma.interlocuteur.findUnique({
    where: { id: contactId },
    select: { email: true },
  });

  if (!contact?.email) {
    return false;
  }

  await prisma.interlocuteur.update({
    where: { id: contactId },
    data: { portalEnabled: true },
  });

  return true;
}

/**
 * Disable portal access for a contact
 */
export async function disablePortalAccess(contactId: string): Promise<void> {
  await prisma.interlocuteur.update({
    where: { id: contactId },
    data: {
      portalEnabled: false,
      portalToken: null,
      portalTokenExpiry: null,
    },
  });
}










