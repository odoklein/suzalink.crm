"use client";

import { useState } from "react";
import { X, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type AttachmentPreviewProps = {
  fileUrl: string;
  fileName: string;
  fileType: string;
  thumbnailUrl?: string | null;
  onRemove?: () => void;
  showRemove?: boolean;
};

export function AttachmentPreview({
  fileUrl,
  fileName,
  fileType,
  thumbnailUrl,
  onRemove,
  showRemove = false,
}: AttachmentPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (fileType === "image") {
    return (
      <>
        <div className="relative group">
          <div
            className="relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer border border-gray-200"
            onClick={() => setIsOpen(true)}
          >
            <Image
              src={thumbnailUrl || fileUrl}
              alt={fileName}
              fill
              className="object-cover"
              sizes="128px"
            />
          </div>
          {showRemove && onRemove && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{fileName}</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[70vh]">
              <Image
                src={fileUrl}
                alt={fileName}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = fileUrl;
                  link.download = fileName;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg bg-gray-50">
      <div className="p-2 bg-white rounded">
        <ImageIcon className="h-5 w-5 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-main truncate">{fileName}</p>
        <p className="text-xs text-text-body">{fileType.toUpperCase()}</p>
      </div>
      {showRemove && onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
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

