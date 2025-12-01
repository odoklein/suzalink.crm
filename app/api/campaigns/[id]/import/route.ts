import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Readable } from "stream";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { parseCSVHeadersFromStream, parseCSVPreviewFromStream } from "@/lib/csv-parser";
import { processCSVImportFromBlob } from "@/lib/csv-processor";
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const blobName = `${Date.now()}_${file.name}`;
    const { url: blobUrl } = await put(blobName, buffer, {
      access: "public",
    });

    const stream = Readable.from(buffer);

    const headers = await parseCSVHeadersFromStream(stream);

    const previewStream = Readable.from(buffer);
    const preview = await parseCSVPreviewFromStream(previewStream, 5);

    return NextResponse.json({
      blobUrl,
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
    const { blobUrl, mappings, schemaConfig } = body;

    if (!blobUrl || !mappings) {
      return NextResponse.json(
        { error: "Blob URL and mappings are required" },
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
      const result = await processCSVImportFromBlob({
        campaignId: id,
        blobUrl,
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

