"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Download, 
  UserPlus,
  Tag,
  CheckSquare,
  Loader2,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkOperationsProps {
  selectedItems: string[];
  entity: 'leads' | 'campaigns' | 'accounts';
  onClearSelection: () => void;
  onRefresh?: () => void;
}

interface BulkOperationResult {
  success: boolean;
  message: string;
  affected: number;
  data?: any[];
}

const BULK_OPERATIONS = {
  leads: [
    { 
      id: 'update_status', 
      label: 'Update Status', 
      icon: CheckSquare, 
      requiresData: true,
      dangerous: false 
    },
    { 
      id: 'assign', 
      label: 'Assign to User', 
      icon: UserPlus, 
      requiresData: true,
      dangerous: false 
    },
    { 
      id: 'add_tags', 
      label: 'Add Tags', 
      icon: Tag, 
      requiresData: true,
      dangerous: false 
    },
    { 
      id: 'export', 
      label: 'Export Selected', 
      icon: Download, 
      requiresData: false,
      dangerous: false 
    },
    { 
      id: 'delete', 
      label: 'Delete Selected', 
      icon: Trash2, 
      requiresData: false,
      dangerous: true 
    },
  ],
  campaigns: [
    { 
      id: 'update_status', 
      label: 'Update Status', 
      icon: CheckSquare, 
      requiresData: true,
      dangerous: false 
    },
    { 
      id: 'assign', 
      label: 'Assign to BD', 
      icon: UserPlus, 
      requiresData: true,
      dangerous: false 
    },
    { 
      id: 'export', 
      label: 'Export Selected', 
      icon: Download, 
      requiresData: false,
      dangerous: false 
    },
    { 
      id: 'duplicate', 
      label: 'Duplicate Selected', 
      icon: Edit, 
      requiresData: false,
      dangerous: false 
    },
    { 
      id: 'delete', 
      label: 'Delete Selected', 
      icon: Trash2, 
      requiresData: false,
      dangerous: true 
    },
  ],
  accounts: [
    { 
      id: 'export', 
      label: 'Export Selected', 
      icon: Download, 
      requiresData: false,
      dangerous: false 
    },
    { 
      id: 'delete', 
      label: 'Delete Selected', 
      icon: Trash2, 
      requiresData: false,
      dangerous: true 
    },
  ],
};

const STATUS_OPTIONS = {
  leads: [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Nurture', label: 'Nurture' },
    { value: 'Lost', label: 'Lost' },
  ],
  campaigns: [
    { value: 'Draft', label: 'Draft' },
    { value: 'Active', label: 'Active' },
    { value: 'Paused', label: 'Paused' },
    { value: 'Completed', label: 'Completed' },
  ],
  accounts: [],
};

export function BulkOperations({ 
  selectedItems, 
  entity, 
  onClearSelection,
  onRefresh 
}: BulkOperationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<string | null>(null);
  const [operationData, setOperationData] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const bulkMutation = useMutation({
    mutationFn: async ({ operation, data }: { operation: string; data?: Record<string, any> }) => {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity,
          operation,
          itemIds: selectedItems,
          data,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Bulk operation failed');
      }

      return res.json() as Promise<BulkOperationResult>;
    },
    onSuccess: (result) => {
      toast({
        title: result.success ? "Success" : "Warning",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });

      if (result.success) {
        onClearSelection();
        onRefresh?.();
        
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: [entity] });
        queryClient.invalidateQueries({ queryKey: ['search'] });
        
        // Handle export operation
        if (currentOperation === 'export' && result.data) {
          handleExport(result.data);
        }
      }
      
      setDialogOpen(false);
      setCurrentOperation(null);
      setOperationData({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Bulk operation failed",
        variant: "destructive",
      });
    },
  });

  const handleOperationClick = (operationId: string) => {
    const operation = BULK_OPERATIONS[entity].find(op => op.id === operationId);
    if (!operation) return;

    setCurrentOperation(operationId);
    
    if (operation.requiresData) {
      setDialogOpen(true);
    } else {
      // Execute immediately for operations that don't require additional data
      bulkMutation.mutate({ operation: operationId });
    }
  };

  const handleConfirmOperation = () => {
    if (!currentOperation) return;
    
    bulkMutation.mutate({ 
      operation: currentOperation, 
      data: operationData 
    });
  };

  const handleExport = (data: any[]) => {
    // Convert data to CSV and trigger download
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value).replace(/"/g, '""');
          }
          return `"${String(value || '').replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderOperationForm = () => {
    if (!currentOperation) return null;

    switch (currentOperation) {
      case 'update_status':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select
                value={operationData.status || ''}
                onValueChange={(value) => setOperationData({ ...operationData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS[entity].map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'assign':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">
                {entity === 'campaigns' ? 'Assign to Business Developer' : 'Assign to User'}
              </Label>
              <Input
                id="assignee"
                value={operationData.assigneeId || ''}
                onChange={(e) => setOperationData({ ...operationData, assigneeId: e.target.value })}
                placeholder={entity === 'campaigns' ? "Enter BD user ID or email" : "Enter user ID or email"}
              />
              {entity === 'campaigns' && (
                <p className="text-xs text-text-body mt-1">
                  The selected BD will be assigned to all leads in these campaigns
                </p>
              )}
            </div>
          </div>
        );

      case 'add_tags':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={operationData.tagsInput || ''}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                  setOperationData({ 
                    ...operationData, 
                    tagsInput: e.target.value,
                    tags 
                  });
                }}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  const operations = BULK_OPERATIONS[entity];
  const currentOp = operations.find(op => op.id === currentOperation);

  return (
    <>
      <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-900">
            {selectedItems.length} {entity} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {operations.map((operation) => {
                const Icon = operation.icon;
                return (
                  <DropdownMenuItem
                    key={operation.id}
                    onClick={() => handleOperationClick(operation.id)}
                    className={operation.dangerous ? "text-destructive" : ""}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {operation.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" onClick={onClearSelection}>
            Clear Selection
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentOp?.icon && <currentOp.icon className="h-5 w-5" />}
              {currentOp?.label}
            </DialogTitle>
            <DialogDescription>
              This action will affect {selectedItems.length} {entity}.
              {currentOp?.dangerous && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-destructive-50 border border-destructive-200 rounded">
                  <AlertTriangle className="h-4 w-4 text-destructive-600" />
                  <span className="text-sm text-destructive-800">
                    This action cannot be undone.
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {renderOperationForm()}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmOperation}
              disabled={bulkMutation.isPending}
              variant={currentOp?.dangerous ? "destructive" : "default"}
            >
              {bulkMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



