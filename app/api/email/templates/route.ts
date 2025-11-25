import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_EMAIL_TEMPLATES, validateEmailTemplate } from "@/lib/email-templates";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch templates from database
    const templates = await prisma.emailTemplate.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // If no templates exist, create default ones
    if (templates.length === 0) {
      const defaultTemplates = await Promise.all(
        DEFAULT_EMAIL_TEMPLATES.map(template =>
          prisma.emailTemplate.create({
            data: {
              userId: session.user.id,
              name: template.name,
              subject: template.subject,
              content: template.content,
              variables: template.variables,
              category: template.category,
            },
          })
        )
      );
      return NextResponse.json(defaultTemplates);
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Email templates error:", error);
    return NextResponse.json(
      { error: "Failed to fetch email templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templateData = await request.json();
    
    // Validate template
    const validation = validateEmailTemplate(templateData);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Invalid template", details: validation.errors },
        { status: 400 }
      );
    }

    // Create new template in database
    const newTemplate = await prisma.emailTemplate.create({
      data: {
        userId: session.user.id,
        name: templateData.name,
        subject: templateData.subject,
        content: templateData.content,
        variables: templateData.variables || null,
        category: templateData.category || 'general',
        isActive: templateData.isActive !== false,
      },
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { error: "Failed to create email template" },
      { status: 500 }
    );
  }
}
