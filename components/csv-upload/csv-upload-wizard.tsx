"use client";

import { useState, useCallback, useMemo } from "react";
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Loader2,
  Upload,
  Table,
  GitBranch,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";
import { cn } from "@/lib/utils";

// Import new components
import { UploadDropzone } from "./upload-dropzone";
import { DataPreviewTable } from "./data-preview-table";
import { MappingCanvas, FieldMapping } from "./mapping-canvas";
import { ImportProgress, ImportResult } from "./import-progress";

type Step = "upload" | "preview" | "mapping" | "importing";

type CSVRow = Record<string, string>;

interface FileInfo {
  name: string;
  size: number;
  type: string;
  rowCount?: number;
  columnCount?: number;
}

const STEPS: { key: Step; label: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Upload", icon: Upload },
  { key: "preview", label: "Preview", icon: Table },
  { key: "mapping", label: "Map Fields", icon: GitBranch },
  { key: "importing", label: "Import", icon: Rocket },
];

// Step indicator component
function StepIndicator({ 
  currentStep, 
  steps,
}: { 
  currentStep: Step; 
  steps: typeof STEPS;
}) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-1">
        {steps.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = index < currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex items-center">
              {/* Step circle */}
              <div
                className={cn(
                  "relative flex items-center justify-center transition-all duration-500",
                  "h-12 w-12 rounded-full",
                  isActive && "bg-primary-500 text-white shadow-lg shadow-primary-500/30 scale-110",
                  isCompleted && "bg-success-500 text-white",
                  !isActive && !isCompleted && "bg-gray-100 text-gray-400"
                )}
              >
                {/* Pulse animation for active */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-primary-400 animate-ping opacity-20" />
                )}
                
                {isCompleted ? (
                  <Check className="h-5 w-5 animate-in zoom-in-50 duration-300" />
                ) : (
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-300",
                    isActive && "scale-110"
                  )} />
                )}
              </div>

              {/* Step label */}
              <div className={cn(
                "ml-2 mr-4 transition-all duration-300",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                <p className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary-600" : isCompleted ? "text-success-600" : "text-gray-500"
                )}>
                  Step {index + 1}
                </p>
                <p className={cn(
                  "text-sm font-semibold",
                  isActive ? "text-text-main" : "text-text-body"
                )}>
                  {step.label}
                </p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-12 h-0.5 mr-4 rounded-full transition-all duration-500",
                  index < currentIndex ? "bg-success-400" : "bg-gray-200"
                )}>
                  {/* Animated progress */}
                  {index === currentIndex - 1 && (
                    <div className="h-full bg-success-500 rounded-full animate-in slide-in-from-left duration-500" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CSVUploadWizard({ campaignId }: { campaignId: string }) {
  const { toast } = useToast();
  
  // State
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [filePath, setFilePath] = useState<string>("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Fetch campaign schema config
  const { data: campaign } = useQuery({
    queryKey: ["campaign", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch campaign");
      return res.json();
    },
  });

  const schemaConfig: SchemaField[] = campaign?.schemaConfig || [];

  // Handle file upload
  const handleFileAccepted = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to upload file");
      }

      const data = await res.json();
      
      setHeaders(data.headers);
      setPreview(data.preview);
      setFilePath(data.blobUrl);
      setFileInfo({
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        columnCount: data.headers.length,
        rowCount: data.totalRows || data.preview.length * 10, // Estimate if not provided
      });

      // Transition to preview
      setTimeout(() => {
        setStep("preview");
      }, 500);
    } catch (error: any) {
      setUploadError(error.message || "Failed to upload file");
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [campaignId, toast]);

  // Handle file rejection
  const handleFileRejected = useCallback((message: string) => {
    setUploadError(message);
    toast({
      title: "Invalid File",
      description: message,
      variant: "destructive",
    });
  }, [toast]);

  // Reset upload
  const handleResetUpload = useCallback(() => {
    setFile(null);
    setFileInfo(null);
    setUploadError(null);
    setHeaders([]);
    setPreview([]);
    setFilePath("");
  }, []);

  // Proceed to mapping
  const handleProceedToMapping = useCallback(() => {
    setStep("mapping");
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);
    setStep("importing");

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // Build mappings object and schema config
      const mappingsObj: Record<string, string> = {};
      const newSchemaFields: SchemaField[] = [...schemaConfig];
      const existingFieldKeys = new Set(schemaConfig.map((f) => f.key));

      mappings.forEach((mapping) => {
        if (mapping.systemField && mapping.systemField !== "skip" && mapping.systemField !== "") {
          if (mapping.systemField === "custom" && mapping.customFieldKey) {
            mappingsObj[mapping.csvColumn] = `custom:${mapping.customFieldKey}`;
            
            // Add to schema config if it doesn't exist
            if (!existingFieldKeys.has(mapping.customFieldKey)) {
              newSchemaFields.push({
                key: mapping.customFieldKey,
                label: mapping.fieldLabel || mapping.csvColumn,
                type: mapping.fieldType || "text",
                options: mapping.dropdownOptions || (mapping.fieldType === "dropdown" ? [] : undefined),
                required: mapping.required || false,
              });
              existingFieldKeys.add(mapping.customFieldKey);
            }
          } else {
            mappingsObj[mapping.csvColumn] = mapping.systemField;
          }
        }
      });

      const res = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: filePath,
          mappings: mappingsObj,
          schemaConfig: newSchemaFields,
        }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to import CSV");
      }

      const result = await res.json();
      setImportResult({
        success: result.success,
        processed: result.processed,
        errors: result.errors,
        errorDetails: result.errorDetails,
      });

      if (result.success) {
        if (result.errors > 0) {
          toast({
            title: "Import completed with errors",
            description: `${result.processed} leads imported, ${result.errors} errors occurred.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Import Successful",
            description: `Successfully imported ${result.processed} leads.`,
          });
        }
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      setImportProgress(0);
      setImportResult({
        success: false,
        processed: 0,
        errors: 1,
        errorDetails: [{ row: 0, reason: error.message || "Import failed" }],
      });
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  }, [campaignId, filePath, mappings, schemaConfig, toast]);

  // Reset and import another
  const handleImportAnother = useCallback(() => {
    setStep("upload");
    setFile(null);
    setFileInfo(null);
    setHeaders([]);
    setPreview([]);
    setMappings([]);
    setImportResult(null);
    setImportProgress(0);
    setFilePath("");
    setUploadError(null);
  }, []);

  // View leads
  const handleViewLeads = useCallback(() => {
    window.location.href = `/campaigns/${campaignId}`;
  }, [campaignId]);

  // Calculate if can proceed with import
  const canImport = useMemo(() => {
    return mappings.some(m => 
      m.systemField && 
      m.systemField !== "skip" && 
      m.systemField !== ""
    );
  }, [mappings]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Step Indicator */}
      <StepIndicator currentStep={step} steps={STEPS} />

      {/* Step Content */}
      <div className="min-h-[500px]">
        {/* Upload Step */}
        {step === "upload" && (
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-text-main mb-2">
                  Upload Your CSV File
                </h2>
                <p className="text-text-body max-w-lg mx-auto">
                  Import leads from a CSV or Excel file. We'll help you map columns to the right fields and validate your data.
                </p>
              </div>

              <UploadDropzone
                onFileAccepted={handleFileAccepted}
                onFileRejected={handleFileRejected}
                isUploading={isUploading}
                uploadProgress={isUploading ? 50 : 0}
                fileInfo={fileInfo}
                error={uploadError}
                onReset={handleResetUpload}
              />
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
            <CardContent className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-main mb-2">
                  Review Your Data
                </h2>
                <p className="text-text-body">
                  We've analyzed your file. Review the column statistics and sample data below.
                </p>
              </div>

              <DataPreviewTable
                headers={headers}
                data={preview}
                totalRows={fileInfo?.rowCount}
              />

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    handleResetUpload();
                    setStep("upload");
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Upload Different File
                </Button>
                <Button onClick={handleProceedToMapping}>
                  Continue to Mapping
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mapping Step */}
        {step === "mapping" && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
            <CardContent className="p-8">
              <MappingCanvas
                csvHeaders={headers}
                sampleData={preview}
                existingSchemaFields={schemaConfig}
                mappings={mappings}
                onMappingsChange={setMappings}
              />

              <div className="flex justify-between items-center mt-8 pt-6 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setStep("preview")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Preview
                </Button>
                <Button 
                  onClick={handleImport}
                  disabled={!canImport || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Starting Import...
                    </>
                  ) : (
                    <>
                      Start Import
                      <Rocket className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Step */}
        {step === "importing" && (
          <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
            <CardContent className="p-8">
              <ImportProgress
                isImporting={isImporting}
                progress={importProgress}
                result={importResult}
                onImportAnother={handleImportAnother}
                onViewLeads={handleViewLeads}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
