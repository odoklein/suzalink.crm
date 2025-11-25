import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get email accounts for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to fetch from the new EmailAccount table first
    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        provider: true,
        isDefault: true,
        isActive: true,
        imapHost: true,
        imapPort: true,
        smtpHost: true,
        smtpPort: true,
        syncEnabled: true,
        syncInterval: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        lastSyncError: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if we have any accounts
    const isConfigured = emailAccounts.length > 0;
    const defaultAccount = emailAccounts.find(a => a.isDefault) || emailAccounts[0];

    return NextResponse.json({
      isConfigured,
      accounts: emailAccounts,
      // For backwards compatibility
      email: defaultAccount?.email,
      imapHost: defaultAccount?.imapHost,
      smtpHost: defaultAccount?.smtpHost,
    });
  } catch (error: any) {
    console.error("Error fetching email settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch email settings" },
      { status: 500 }
    );
  }
}

// Save email account settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id, // If provided, update existing account
      name,
      provider,
      imap_host,
      imap_port,
      imap_user,
      imap_password,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password,
      isDefault,
    } = body;

    // Validate required fields
    if (!imap_host || !imap_user || !imap_password) {
      return NextResponse.json(
        { error: "IMAP host, user, and password are required" },
        { status: 400 }
      );
    }

    if (!smtp_host || !smtp_user || !smtp_password) {
      return NextResponse.json(
        { error: "SMTP host, user, and password are required" },
        { status: 400 }
      );
    }

    // Check if this is an update or create
    if (id) {
      // Update existing account
      const existingAccount = await prisma.emailAccount.findFirst({
        where: { id, userId: session.user.id },
      });

      if (!existingAccount) {
        return NextResponse.json(
          { error: "Email account not found" },
          { status: 404 }
        );
      }

      const updatedAccount = await prisma.emailAccount.update({
        where: { id },
        data: {
          name: name || existingAccount.name,
          provider: provider || "custom",
          imapHost: imap_host,
          imapPort: imap_port || 993,
          imapUser: imap_user,
          imapPassword: imap_password,
          smtpHost: smtp_host,
          smtpPort: smtp_port || 587,
          smtpUser: smtp_user,
          smtpPassword: smtp_password,
          isDefault: isDefault ?? existingAccount.isDefault,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Email account updated successfully",
        account: {
          id: updatedAccount.id,
          name: updatedAccount.name,
          email: updatedAccount.email,
          provider: updatedAccount.provider,
          isDefault: updatedAccount.isDefault,
        },
      });
    } else {
      // Create new account
      // Check if this email is already configured
      const existingAccount = await prisma.emailAccount.findFirst({
        where: {
          userId: session.user.id,
          email: imap_user,
        },
      });

      if (existingAccount) {
        return NextResponse.json(
          { error: "This email is already configured" },
          { status: 400 }
        );
      }

      // Check if this should be the default account
      const accountCount = await prisma.emailAccount.count({
        where: { userId: session.user.id },
      });

      // If setting this as default, unset other defaults
      if (isDefault || accountCount === 0) {
        await prisma.emailAccount.updateMany({
          where: { userId: session.user.id },
          data: { isDefault: false },
        });
      }

      const newAccount = await prisma.emailAccount.create({
        data: {
          userId: session.user.id,
          name: name || getAccountName(imap_user, provider),
          email: imap_user,
          provider: provider || "custom",
          imapHost: imap_host,
          imapPort: imap_port || 993,
          imapUser: imap_user,
          imapPassword: imap_password,
          smtpHost: smtp_host,
          smtpPort: smtp_port || 587,
          smtpUser: smtp_user,
          smtpPassword: smtp_password,
          isDefault: isDefault || accountCount === 0,
        },
      });

      // Also update the legacy emailSettings field for backwards compatibility
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          emailSettings: {
            imap_host,
            imap_port: imap_port || 993,
            imap_user,
            imap_password,
            smtp_host,
            smtp_port: smtp_port || 587,
            smtp_user,
            smtp_password,
          },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Email account created successfully",
        account: {
          id: newAccount.id,
          name: newAccount.name,
          email: newAccount.email,
          provider: newAccount.provider,
          isDefault: newAccount.isDefault,
        },
      });
    }
  } catch (error: any) {
    console.error("Error saving email settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save email settings" },
      { status: 500 }
    );
  }
}

// Delete email account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("id");

    if (accountId) {
      // Delete specific account
      const account = await prisma.emailAccount.findFirst({
        where: { id: accountId, userId: session.user.id },
      });

      if (!account) {
        return NextResponse.json(
          { error: "Email account not found" },
          { status: 404 }
        );
      }

      await prisma.emailAccount.delete({
        where: { id: accountId },
      });

      // If this was the default, set another as default
      if (account.isDefault) {
        const nextAccount = await prisma.emailAccount.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "asc" },
        });

        if (nextAccount) {
          await prisma.emailAccount.update({
            where: { id: nextAccount.id },
            data: { isDefault: true },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: "Email account removed successfully",
      });
    } else {
      // Delete all accounts (legacy behavior)
      await prisma.emailAccount.deleteMany({
        where: { userId: session.user.id },
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: { emailSettings: null },
      });

      return NextResponse.json({
        success: true,
        message: "All email accounts removed successfully",
      });
    }
  } catch (error: any) {
    console.error("Error removing email settings:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove email settings" },
      { status: 500 }
    );
  }
}

// Helper to generate account name from email
function getAccountName(email: string, provider?: string): string {
  if (provider === "gmail") return "Gmail";
  if (provider === "outlook") return "Outlook";
  
  // Extract name from email
  const domain = email.split("@")[1];
  if (domain?.includes("gmail")) return "Gmail";
  if (domain?.includes("outlook") || domain?.includes("hotmail")) return "Outlook";
  if (domain?.includes("yahoo")) return "Yahoo";
  
  return domain ? `Email (${domain})` : "Email Account";
}
