"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Upload, 
  FileSpreadsheet, 
  File, 
  Check, 
  AlertCircle,
  Loader2,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  rowCount?: number;
  columnCount?: number;
}

interface UploadDropzoneProps {
  onFileAccepted: (file: File) => Promise<void>;
  onFileRejected?: (message: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  fileInfo?: FileInfo | null;
  error?: string | null;
  onReset?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.includes("csv") || type.includes("text")) {
    return FileText;
  }
  if (type.includes("excel") || type.includes("spreadsheet")) {
    return FileSpreadsheet;
  }
  return File;
}

export function UploadDropzone({
  onFileAccepted,
  onFileRejected,
  isUploading = false,
  uploadProgress = 0,
  fileInfo,
  error,
  onReset,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      const message = rejection.errors?.[0]?.message || "File type not supported";
      onFileRejected?.(message);
      return;
    }

    if (acceptedFiles.length > 0) {
      await onFileAccepted(acceptedFiles[0]);
    }
  }, [onFileAccepted, onFileRejected]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    disabled: isUploading,
  });

  // Show file info card after successful upload
  if (fileInfo && !isUploading && !error) {
    const FileIcon = getFileIcon(fileInfo.type);
    
    return (
      <div className="animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        <div className="relative p-6 border-2 border-success-300 rounded-xl bg-gradient-to-br from-success-50/50 to-transparent">
          {/* Success indicator */}
          <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-success-500 flex items-center justify-center shadow-lg animate-in zoom-in-50 duration-300 delay-200">
            <Check className="h-4 w-4 text-white" />
          </div>

          <div className="flex items-start gap-4">
            {/* File icon */}
            <div className="h-14 w-14 rounded-xl bg-success-100 flex items-center justify-center flex-shrink-0">
              <FileIcon className="h-7 w-7 text-success-600" />
            </div>

            {/* File details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-text-main truncate pr-8">
                {fileInfo.name}
              </h4>
              <div className="flex items-center gap-4 mt-1.5 text-sm text-text-body">
                <span>{formatFileSize(fileInfo.size)}</span>
                {fileInfo.columnCount && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>{fileInfo.columnCount} columns</span>
                  </>
                )}
                {fileInfo.rowCount && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span>~{fileInfo.rowCount.toLocaleString()} rows</span>
                  </>
                )}
              </div>
            </div>

            {/* Reset button */}
            {onReset && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                onClick={onReset}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="animate-in fade-in-50 duration-300">
        <div className="p-6 border-2 border-destructive-300 rounded-xl bg-gradient-to-br from-destructive-50/50 to-transparent">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-destructive-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-destructive-500" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-destructive-700">Upload Failed</h4>
              <p className="text-sm text-destructive-600 mt-1">{error}</p>
            </div>
            {onReset && (
              <Button variant="outline" size="sm" onClick={onReset}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show uploading state
  if (isUploading) {
    return (
      <div className="animate-in fade-in-50 duration-300">
        <div className="p-8 border-2 border-primary-200 rounded-xl bg-gradient-to-br from-primary-50/30 to-transparent">
          <div className="flex flex-col items-center text-center">
            {/* Animated loader */}
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full border-4 border-primary-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
              </div>
              {/* Pulsing ring */}
              <div className="absolute inset-0 rounded-full border-4 border-primary-300 animate-ping opacity-20" />
            </div>

            <h4 className="font-semibold text-text-main mb-1">Processing your file...</h4>
            <p className="text-sm text-text-body mb-4">
              Analyzing columns and preparing preview
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-text-body mt-2">{Math.round(uploadProgress)}% complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default dropzone
  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer transition-all duration-300 ease-out",
        "p-10 border-2 border-dashed rounded-xl",
        "hover:border-primary-400 hover:bg-primary-50/30",
        isDragActive && !isDragReject && [
          "border-primary-500 bg-primary-50/50",
          "scale-[1.02] shadow-lg shadow-primary-500/10",
        ],
        isDragReject && "border-destructive-400 bg-destructive-50/50",
        !isDragActive && "border-gray-200 bg-gray-50/50"
      )}
    >
      <input {...getInputProps()} />

      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden rounded-xl opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEwyMCA0ME0wIDIwTDQwIDIwIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==')]" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Icon container with animations */}
        <div 
          className={cn(
            "relative mb-5 transition-transform duration-300",
            isDragActive && "scale-110 -translate-y-1",
            "group-hover:scale-105"
          )}
        >
          {/* Background glow */}
          <div className={cn(
            "absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300",
            isDragActive ? "bg-primary-300 opacity-50" : "bg-primary-200 opacity-0 group-hover:opacity-30"
          )} />
          
          {/* Icon box */}
          <div className={cn(
            "relative h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300",
            isDragActive 
              ? "bg-primary-500 text-white shadow-xl shadow-primary-500/30" 
              : "bg-white border border-gray-200 text-gray-400 group-hover:border-primary-200 group-hover:text-primary-500"
          )}>
            <Upload className={cn(
              "h-7 w-7 transition-transform duration-300",
              isDragActive && "animate-bounce"
            )} />
          </div>
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <h3 className={cn(
            "text-lg font-semibold transition-colors duration-300",
            isDragActive ? "text-primary-600" : "text-text-main"
          )}>
            {isDragActive 
              ? isDragReject 
                ? "This file type is not supported"
                : "Drop your file here" 
              : "Drag & drop your CSV file"}
          </h3>
          <p className="text-sm text-text-body">
            or <span className="text-primary-500 font-medium hover:underline">browse files</span> from your computer
          </p>
        </div>

        {/* Supported formats */}
        <div className="mt-6 flex items-center gap-3">
          {[
            { ext: "CSV", color: "bg-emerald-100 text-emerald-700" },
            { ext: "XLS", color: "bg-green-100 text-green-700" },
            { ext: "XLSX", color: "bg-teal-100 text-teal-700" },
          ].map((format, i) => (
            <span
              key={format.ext}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-300",
                format.color,
                "animate-in fade-in-50 slide-in-from-bottom-2"
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              .{format.ext}
            </span>
          ))}
        </div>

        {/* Max size note */}
        <p className="mt-4 text-xs text-gray-400">
          Maximum file size: 50MB
        </p>
      </div>
    </div>
  );
}

