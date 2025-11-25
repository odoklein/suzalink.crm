import { prisma } from "./prisma";
import { streamCSVRows, CSVRow } from "./csv-parser-blob";
import { deleteFile } from "./storage";
import { parseFieldValue, validateFieldValue } from "./field-type-parser";
import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";

export interface CSVImportData {
  campaignId: string;
  filePath: string;
  mappings: Record<string, string>;
  schemaConfig: SchemaField[];
}

export interface CSVImportError {
  row: number;
  reason: string;
  data?: any;
}

export async function processCSVImport(data: CSVImportData): Promise<{
  success: boolean;
  processed: number;
  errors: number;
  errorDetails?: CSVImportError[];
}> {
  const { campaignId, filePath, mappings, schemaConfig } = data;

  let processed = 0;
  let errors = 0;
  const errorDetails: CSVImportError[] = [];
  let rowNumber = 0;

  try {
    await streamCSVRows(filePath, async (rows: CSVRow[]) => {
      const leadsToCreate: Array<{ lead: any; rowNum: number }> = [];

      for (const row of rows) {
        rowNumber++;
        const currentRowNumber = rowNumber;
        try {
          const standardData: Record<string, any> = {};
          const customData: Record<string, any> = {};

          // Create a map of custom field keys to schema config for quick lookup
          const customFieldMap = new Map<string, SchemaField>();
          schemaConfig.forEach((field) => {
            customFieldMap.set(field.key, field);
          });

          // Process mappings
          for (const [csvColumn, systemField] of Object.entries(mappings)) {
            const rawValue = row[csvColumn];

            if (!rawValue || rawValue.trim() === "") continue;

            if (systemField.startsWith("custom:")) {
              const customKey = systemField.replace("custom:", "");
              const fieldConfig = customFieldMap.get(customKey);
              
              // Extract option values for dropdown validation
              let optionValues: string[] | undefined;
              if (fieldConfig?.type === "dropdown" && fieldConfig?.options) {
                optionValues = fieldConfig.options.map((opt) =>
                  typeof opt === "string" ? opt : (opt as DropdownOption).value
                );
              }
              
              // Parse value based on field type
              const parsedValue = parseFieldValue(
                rawValue,
                fieldConfig?.type || "text",
                optionValues
              );

              // Validate if field config exists
              if (fieldConfig) {
                const validation = validateFieldValue(parsedValue, fieldConfig);
                if (!validation.valid) {
                  errorDetails.push({
                    row: rowNumber,
                    reason: `Validation failed for field "${fieldConfig.label}": ${validation.error}`,
                    data: { field: customKey, value: rawValue },
                  });
                  // Continue anyway, but log the error
                }
              }

              customData[customKey] = parsedValue;
            } else {
              // For standard fields, keep as string (they have their own validation)
              standardData[systemField] = rawValue.trim();
            }
          }

          // Validate that we have at least some identifying information
          if (!standardData.email && !standardData.phone && !standardData.firstName) {
            errors++;
            errorDetails.push({
              row: rowNumber,
              reason: "Missing required fields: At least one of email, phone, or firstName must be provided",
              data: { standardData, customData },
            });
            continue;
          }

          // Check for duplicates - use email if available, otherwise phone
          let existingLead = null;
          if (standardData.email) {
            existingLead = await prisma.lead.findFirst({
              where: {
                campaignId,
                standardData: {
                  path: ["email"],
                  equals: standardData.email,
                },
              },
            });
            if (existingLead) {
              errors++;
              errorDetails.push({
                row: rowNumber,
                reason: `Duplicate email: ${standardData.email} already exists in this campaign`,
                data: { email: standardData.email },
              });
              continue;
            }
          } else if (standardData.phone) {
            // Check for duplicate phone number if no email
            existingLead = await prisma.lead.findFirst({
              where: {
                campaignId,
                standardData: {
                  path: ["phone"],
                  equals: standardData.phone,
                },
              },
            });
            if (existingLead) {
              errors++;
              errorDetails.push({
                row: rowNumber,
                reason: `Duplicate phone: ${standardData.phone} already exists in this campaign`,
                data: { phone: standardData.phone },
              });
              continue;
            }
          }

          // Ensure standardData is always an object (required by schema)
          if (Object.keys(standardData).length === 0) {
            errors++;
            errorDetails.push({
              row: rowNumber,
              reason: "No standard data fields mapped. At least one field must be mapped.",
              data: row,
            });
            continue;
          }

          leadsToCreate.push({
            lead: {
              campaignId,
              status: "New",
              standardData,
              customData: Object.keys(customData).length > 0 ? customData : undefined,
            },
            rowNum: currentRowNumber,
          });
        } catch (error: any) {
          errors++;
          const errorMessage = error?.message || String(error) || "Unknown error";
          console.error(`Error processing row ${rowNumber}:`, error);
          errorDetails.push({
            row: rowNumber,
            reason: `Processing error: ${errorMessage}`,
            data: row,
          });
        }
      }

      // Bulk insert
      if (leadsToCreate.length > 0) {
        try {
          const leadData = leadsToCreate.map((item) => item.lead);
          const result = await prisma.lead.createMany({
            data: leadData,
            skipDuplicates: true,
          });
          processed += result.count;
          
          // If some were skipped due to duplicates, count them as errors
          const skipped = leadsToCreate.length - result.count;
          if (skipped > 0) {
            errors += skipped;
            // Note: createMany with skipDuplicates doesn't tell us which ones were skipped
            // These are likely duplicates that were created between our check and the insert
            console.warn(`${skipped} leads were skipped due to duplicates in this batch`);
            // Add generic error messages for skipped leads (we can't identify which ones)
            for (let i = 0; i < skipped && i < leadsToCreate.length; i++) {
              errorDetails.push({
                row: leadsToCreate[i].rowNum,
                reason: `Duplicate email: Lead was skipped (likely duplicate created during import)`,
                data: { email: (leadsToCreate[i].lead.standardData as any)?.email },
              });
            }
          }
        } catch (error: any) {
          // If bulk insert fails, try individual inserts to get better error messages
          console.error("Bulk insert failed, trying individual inserts:", error);
          for (const item of leadsToCreate) {
            try {
              await prisma.lead.create({ data: item.lead });
              processed++;
            } catch (individualError: any) {
              errors++;
              const errorMessage = individualError?.message || String(individualError);
              errorDetails.push({
                row: item.rowNum,
                reason: `Database error: ${errorMessage}`,
                data: { 
                  email: (item.lead.standardData as any)?.email,
                  error: errorMessage,
                },
              });
            }
          }
        }
      }
    });

    // Clean up file (works for both local filesystem and Vercel Blob)
    try {
      await deleteFile(filePath);
    } catch (error) {
      console.error("Error deleting file:", error);
    }

    return {
      success: true,
      processed,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    };
  } catch (error) {
    console.error("Error processing CSV:", error);
    throw error;
  }
}

