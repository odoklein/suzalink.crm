"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { SchemaField, DropdownOption } from "@/components/campaigns/schema-config-editor";

type Step = "upload" | "preview" | "mapping" | "importing";

type CSVHeader = string;
type CSVRow = Record<string, string>;

type Mapping = {
  csvColumn: string;
  systemField: string;
  customFieldKey?: string;
  fieldType?: SchemaField["type"];
  fieldLabel?: string;
  dropdownOptions?: DropdownOption[];
  required?: boolean;
};

const STANDARD_FIELDS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "jobTitle", label: "Job Title" },
];

export function CSVUploadWizard({ campaignId }: { campaignId: string }) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<CSVHeader[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [filePath, setFilePath] = useState<string>("");

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
        await handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const handleFileUpload = async (uploadedFile: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);

      const res = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload file");

      const data = await res.json();
      setHeaders(data.headers);
      setPreview(data.preview);
      setFilePath(data.filePath);
      setStep("preview");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMapping = () => {
    // Initialize mappings for all CSV columns
    const initialMappings: Mapping[] = headers.map((header) => ({
      csvColumn: header,
      systemField: "skip",
    }));
    setMappings(initialMappings);
    setStep("mapping");
  };

  const updateMapping = (index: number, updates: Partial<Mapping>) => {
    const updated = mappings.map((mapping, i) =>
      i === index ? { ...mapping, ...updates } : mapping
    );
    setMappings(updated);
  };

  const [importResult, setImportResult] = useState<{
    processed: number;
    errors: number;
    errorDetails?: Array<{ row: number; reason: string; data?: any }>;
  } | null>(null);

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);
    try {
      // Build mappings object and schema config
      const mappingsObj: Record<string, string> = {};
      const newSchemaFields: SchemaField[] = [...schemaConfig];
      const existingFieldKeys = new Set(schemaConfig.map((f) => f.key));

      mappings.forEach((mapping) => {
        if (mapping.systemField && mapping.systemField !== "skip") {
          mappingsObj[mapping.csvColumn] = mapping.systemField;
        } else if (mapping.customFieldKey) {
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
        }
      });

      const res = await fetch(`/api/campaigns/${campaignId}/import`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath,
          mappings: mappingsObj,
          schemaConfig: newSchemaFields,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to import CSV");
      }

      const result = await res.json();
      setImportResult(result);
      setIsImporting(false);
      setStep("importing");

      if (result.success) {
        if (result.errors > 0) {
          toast({
            title: "Import completed with errors",
            description: `${result.processed} leads imported, ${result.errors} errors occurred. Check details below.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Import Complete",
            description: `Successfully imported ${result.processed} leads.`,
          });
        }
      }
    } catch (error: any) {
      setIsImporting(false);
      toast({
        title: "Error",
        description: error.message || "Failed to import CSV",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        {(["upload", "preview", "mapping", "importing"] as Step[]).map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : ["upload", "preview", "mapping"].indexOf(step) > index
                  ? "bg-success-100 text-success-text"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {["upload", "preview", "mapping"].indexOf(step) > index ? (
                <Check className="h-5 w-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < 3 && (
              <div
                className={`h-1 w-16 ${
                  ["upload", "preview", "mapping"].indexOf(step) > index
                    ? "bg-success-100"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>Select or drag a CSV file to upload</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary-100" : "border-border"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-body">
                {isDragActive
                  ? "Drop the file here"
                  : "Drag & drop a CSV file here, or click to select"}
              </p>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
              {isUploading && (
                <div className="mt-4">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Step */}
      {step === "preview" && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>Review the first 5 rows of your CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {headers.map((header) => (
                      <th key={header} className="border p-2 text-left text-sm font-medium">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {headers.map((header) => (
                        <td key={header} className="border p-2 text-sm">
                          {row[header] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleMapping}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Step */}
      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
            <CardDescription>Map CSV columns to system fields or create custom fields</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mappings.map((mapping, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium text-text-main">{mapping.csvColumn}</Label>
                  </div>
                  <div className="flex-1">
                    <Select
                      value={mapping.systemField || "skip"}
                      onValueChange={(value) => {
                        if (value === "custom") {
                          const fieldKey = mapping.csvColumn.toLowerCase().replace(/\s+/g, "_");
                          updateMapping(index, { 
                            systemField: "", 
                            customFieldKey: fieldKey,
                            fieldLabel: mapping.csvColumn,
                            fieldType: "text",
                          });
                        } else if (value === "skip") {
                          updateMapping(index, { 
                            systemField: "", 
                            customFieldKey: undefined,
                            fieldType: undefined,
                            fieldLabel: undefined,
                          });
                        } else {
                          updateMapping(index, { 
                            systemField: value, 
                            customFieldKey: undefined,
                            fieldType: undefined,
                            fieldLabel: undefined,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        {STANDARD_FIELDS.map((field) => (
                          <SelectItem key={field.key} value={field.key}>
                            {field.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Create Custom Field</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Custom Field Configuration */}
                {mapping.customFieldKey && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div className="space-y-2">
                      <Label className="text-xs text-text-body">Field Label</Label>
                      <Input
                        value={mapping.fieldLabel || ""}
                        onChange={(e) => updateMapping(index, { fieldLabel: e.target.value })}
                        placeholder="Field Label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-text-body">Field Type</Label>
                      <Select
                        value={mapping.fieldType || "text"}
                        onValueChange={(value) => {
                          const updates: Partial<Mapping> = { fieldType: value as SchemaField["type"] };
                          if (value !== "dropdown") {
                            updates.dropdownOptions = undefined;
                          } else if (!mapping.dropdownOptions) {
                            updates.dropdownOptions = [];
                          }
                          updateMapping(index, updates);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="url">URL</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="dropdown">Dropdown</SelectItem>
                          <SelectItem value="tags">Tags</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {mapping.fieldType === "dropdown" && (
                      <div className="col-span-2 space-y-3">
                        <Label className="text-xs text-text-body">Dropdown Options</Label>
                        <div className="space-y-2">
                          {(() => {
                            const options: DropdownOption[] = mapping.dropdownOptions || [];
                            return options.length === 0 ? (
                              <p className="text-xs text-text-body text-center py-2">
                                No options. Add options from CSV values or manually.
                              </p>
                            ) : (
                              options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2 p-2 border rounded bg-white">
                                  <Input
                                    value={option.value}
                                    onChange={(e) => {
                                      const updated = [...options];
                                      updated[optIndex] = { ...option, value: e.target.value };
                                      updateMapping(index, { dropdownOptions: updated });
                                    }}
                                    placeholder="Option value"
                                    className="flex-1 h-8"
                                  />
                                  <Select
                                    value={option.color || "none"}
                                    onValueChange={(color) => {
                                      const updated = [...options];
                                      updated[optIndex] = { ...option, color: color === "none" ? undefined : color };
                                      updateMapping(index, { dropdownOptions: updated });
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[120px]">
                                      <SelectValue placeholder="Color">
                                        {option.color ? (
                                          <div className="flex items-center gap-1">
                                            <div
                                              className="w-3 h-3 rounded border"
                                              style={{ backgroundColor: option.color }}
                                            />
                                          </div>
                                        ) : (
                                          "Color"
                                        )}
                                      </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No color</SelectItem>
                                      <SelectItem value="#3BBF7A">Mint Green</SelectItem>
                                      <SelectItem value="#4C85FF">Blue</SelectItem>
                                      <SelectItem value="#FFA445">Orange</SelectItem>
                                      <SelectItem value="#A46CFF">Purple</SelectItem>
                                      <SelectItem value="#FF6D9D">Pink</SelectItem>
                                      <SelectItem value="#20C4B5">Teal</SelectItem>
                                      <SelectItem value="#FF4D4F">Red</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {option.color && (
                                    <Input
                                      type="color"
                                      value={option.color}
                                      onChange={(e) => {
                                        const updated = [...options];
                                        updated[optIndex] = { ...option, color: e.target.value };
                                        updateMapping(index, { dropdownOptions: updated });
                                      }}
                                      className="h-8 w-12"
                                    />
                                  )}
                                </div>
                              ))
                            );
                          })()}
                        </div>
                        <p className="text-xs text-text-body">
                          Tip: Options will be auto-detected from CSV values. You can add colors manually.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("preview")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Start Import
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Importing Step */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-12">
            {isImporting ? (
              <div className="text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-h2 mb-2">Importing CSV</h3>
                <p className="text-body text-text-body">
                  Your CSV file is being processed. This may take a few minutes.
                </p>
              </div>
            ) : importResult ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-h2 font-semibold text-text-main mb-2">Import Complete</h3>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-[28px] font-semibold text-success-500">
                        {importResult.processed}
                      </div>
                      <p className="text-sm text-text-body">Leads Imported</p>
                    </div>
                    {importResult.errors > 0 && (
                      <div className="text-center">
                        <div className="text-[28px] font-semibold text-danger-500">
                          {importResult.errors}
                        </div>
                        <p className="text-sm text-text-body">Errors</p>
                      </div>
                    )}
                  </div>
                </div>

                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                  <div className="mt-6 space-y-2">
                    <h4 className="text-sm font-semibold text-text-main">Error Details:</h4>
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {importResult.errorDetails.slice(0, 20).map((error, index) => (
                        <div
                          key={index}
                          className="p-3 bg-danger-100/50 border border-danger-200 rounded-lg"
                        >
                          <p className="text-xs font-medium text-danger-700">
                            Row {error.row}: {error.reason}
                          </p>
                          {error.data && (
                            <p className="text-xs text-text-body mt-1">
                              Data: {JSON.stringify(error.data).slice(0, 100)}...
                            </p>
                          )}
                        </div>
                      ))}
                      {importResult.errorDetails.length > 20 && (
                        <p className="text-xs text-text-body text-center">
                          ... and {importResult.errorDetails.length - 20} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep("upload");
                      setFile(null);
                      setHeaders([]);
                      setPreview([]);
                      setMappings([]);
                      setImportResult(null);
                    }}
                  >
                    Import Another File
                  </Button>
                  <Button
                    onClick={() => {
                      window.location.href = `/campaigns/${campaignId}/leads`;
                    }}
                  >
                    View Leads
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-body text-text-body">Processing...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

