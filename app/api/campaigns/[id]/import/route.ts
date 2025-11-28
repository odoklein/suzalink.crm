import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { parseCSVHeaders, parseCSVPreview } from "@/lib/csv-parser";
import { processCSVImport } from "@/lib/csv-processor";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // For BD users, verify they have access to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: id,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Access denied to this campaign" },
          { status: 403 }
        );
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Save file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = join(process.cwd(), "uploads");
    
    // Create uploads directory if it doesn't exist
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }
    
    const filePath = join(uploadsDir, `${Date.now()}_${file.name}`);

    await writeFile(filePath, buffer);

    // Parse CSV headers and preview
    const headers = await parseCSVHeaders(filePath);
    const preview = await parseCSVPreview(filePath, 5);

    return NextResponse.json({
      filePath,
      headers,
      preview,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // For BD users, verify they have access to this campaign
    if (session.user.role === "BD") {
      const assignment = await prisma.campaignAssignment.findUnique({
        where: {
          campaignId_userId: {
            campaignId: id,
            userId: session.user.id,
          },
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Access denied to this campaign" },
          { status: 403 }
        );
      }
    }
    
    const body = await request.json();
    const { filePath, mappings, schemaConfig } = body;

    if (!filePath || !mappings) {
      return NextResponse.json(
        { error: "File path and mappings are required" },
        { status: 400 }
      );
    }

    // Update campaign schema config if new fields were added
    if (schemaConfig && schemaConfig.length > 0) {
      const campaign = await prisma.campaign.findUnique({
        where: { id },
        select: { schemaConfig: true },
      });

      const existingConfig = (campaign?.schemaConfig as any[]) || [];
      const existingKeys = new Set(existingConfig.map((f: any) => f.key));
      
      // Merge new fields with existing ones
      const mergedConfig = [...existingConfig];
      schemaConfig.forEach((field: any) => {
        if (!existingKeys.has(field.key)) {
          mergedConfig.push(field);
        }
      });

      // Update campaign with merged schema config
      await prisma.campaign.update({
        where: { id },
        data: { schemaConfig: mergedConfig },
      });
    }

    // Process CSV import and wait for completion to return results
    try {
      const result = await processCSVImport({
        campaignId: id,
        filePath,
        mappings,
        schemaConfig: schemaConfig || [],
      });

      console.log(`CSV import completed: ${result.processed} processed, ${result.errors} errors`);
      if (result.errorDetails && result.errorDetails.length > 0) {
        console.log("Import errors:", JSON.stringify(result.errorDetails, null, 2));
      }

      return NextResponse.json({
        success: true,
        message: "Import completed",
        processed: result.processed,
        errors: result.errors,
        errorDetails: result.errorDetails || [],
      });
    } catch (error: any) {
      console.error("CSV import error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process CSV import",
          message: error?.message || String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error starting import:", error);
    return NextResponse.json(
      { error: "Failed to start import" },
      { status: 500 }
    );
  }
}

