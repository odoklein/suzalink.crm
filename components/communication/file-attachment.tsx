"use client";

import { FileText, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FileAttachmentProps = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
};

export function FileAttachment({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  onRemove,
  showRemove = false,
  className,
}: FileAttachmentProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (fileType === "pdf") {
      return "📄";
    }
    if (fileType === "image") {
      return "🖼️";
    }
    return "📎";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors",
        className
      )}
    >
      <div className="text-2xl">{getFileIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate">{fileName}</p>
        {fileSize && (
          <p className="text-xs text-text-body">{formatFileSize(fileSize)}</p>
        )}
      </div>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 flex-shrink-0"
        onClick={() => {
          const link = document.createElement("a");
          link.href = fileUrl;
          link.download = fileName;
          link.click();
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}

