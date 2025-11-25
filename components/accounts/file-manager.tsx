"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  File,
  Image,
  FileSpreadsheet,
  FileCode,
  FileVideo,
  Music,
  Archive,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AccountFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  description?: string;
  isPublic: boolean;
  category: string;
  createdAt: string;
  uploader: {
    email: string;
  };
}

interface FileManagerProps {
  accountId: string;
}

export function FileManager({ accountId }: FileManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    description: "",
    isPublic: false,
    category: "general",
  });

  const { data: files = [], isLoading } = useQuery<AccountFile[]>({
    queryKey: ["account-files", accountId],
    queryFn: async () => {
      const res = await fetch(`/api/accounts/${accountId}/files`);
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("description", uploadData.description);
      formData.append("isPublic", uploadData.isPublic.toString());
      formData.append("category", uploadData.category);

      const res = await fetch(`/api/accounts/${accountId}/files`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to upload file");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-files", accountId] });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setUploadData({ description: "", isPublic: false, category: "general" });
      toast({ title: "Success", description: "File uploaded successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/accounts/${accountId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-files", accountId] });
      toast({ title: "Success", description: "File deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePublicMutation = useMutation({
    mutationFn: async ({ fileId, isPublic }: { fileId: string; isPublic: boolean }) => {
      const res = await fetch(`/api/accounts/${accountId}/files/${fileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic }),
      });
      if (!res.ok) throw new Error("Failed to update file");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["account-files", accountId] });
      toast({ title: "Success", description: "File visibility updated" });
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const categoryColors: Record<string, string> = {
    contract: "bg-purple-100 text-purple-700",
    report: "bg-blue-100 text-blue-700",
    presentation: "bg-green-100 text-green-700",
    general: "bg-gray-100 text-gray-700",
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
      return FileSpreadsheet;
    if (mimeType.includes("video")) return FileVideo;
    if (mimeType.includes("audio")) return Music;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive"))
      return Archive;
    if (mimeType.includes("code") || mimeType.includes("text")) return FileCode;
    return File;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
        setIsUploadOpen(true);
      }
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
  });

  return (
    <Card
      {...getRootProps()}
      className={cn(
        "group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
        "animate-in fade-in slide-in-from-bottom-4",
        isDragActive && "ring-2 ring-primary-500 ring-offset-2 bg-primary-50/50"
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Files & Documents</CardTitle>
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">File *</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile && (
                    <p className="text-sm text-text-body">
                      {selectedFile.name} ({formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-description">Description</Label>
                  <Textarea
                    id="file-description"
                    value={uploadData.description}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, description: e.target.value })
                    }
                    placeholder="Brief description of the file"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-category">Category</Label>
                  <Select
                    value={uploadData.category}
                    onValueChange={(value) =>
                      setUploadData({ ...uploadData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="file-public"
                    checked={uploadData.isPublic}
                    onCheckedChange={(checked) =>
                      setUploadData({ ...uploadData, isPublic: checked as boolean })
                    }
                  />
                  <Label htmlFor="file-public" className="cursor-pointer">
                    Visible in guest portal
                  </Label>
                </div>

                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={!selectedFile || uploadMutation.isPending}
                  className="w-full"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload File
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <input {...getInputProps()} />
        {isDragActive && (
          <div className="mb-4 p-8 border-2 border-dashed border-primary-500 rounded-lg bg-primary-50/50 text-center animate-in fade-in">
            <Upload className="mx-auto h-12 w-12 text-primary-500 mb-3" />
            <p className="text-body font-medium text-primary-700">Drop file here to upload</p>
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-8 text-text-body">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500 mb-3" />
            <p>Loading files...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-text-body mb-3 opacity-50 animate-bounce" />
            <p className="text-body text-text-body mb-4">No files uploaded yet</p>
            <p className="text-sm text-muted-foreground">
              Drag and drop files here or click Upload File
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file, index) => {
              const FileIcon = getFileIcon(file.mimeType);
              const isImage = file.mimeType.startsWith("image/");
              return (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center justify-between p-3 border border-border rounded-lg",
                    "hover:bg-surface hover:shadow-sm transition-all duration-300 group/file",
                    "animate-in slide-in-from-right-4 fade-in"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative group/icon">
                      <FileIcon className="h-8 w-8 text-primary-500 transition-transform duration-300 group-hover/file:scale-110" />
                      {isImage && (
                        <div className="absolute inset-0 opacity-0 group-hover/icon:opacity-100 transition-opacity">
                          <img
                            src={file.fileUrl}
                            alt={file.fileName}
                            className="h-8 w-8 rounded object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-text-main truncate">{file.fileName}</p>
                        <Badge className={categoryColors[file.category]}>
                          {file.category}
                        </Badge>
                        {file.isPublic && (
                          <Badge className="bg-green-100 text-green-700">
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-text-body">
                        {formatFileSize(file.fileSize)} • Uploaded by {file.uploader.email} •{" "}
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                      {file.description && (
                        <p className="text-sm text-text-body mt-1">{file.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover/file:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          togglePublicMutation.mutate({
                            fileId: file.id,
                            isPublic: !file.isPublic,
                          })
                        }
                        title={file.isPublic ? "Make private" : "Make public"}
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        {file.isPublic ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <a href={file.fileUrl} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(file.id)}
                        className="transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



