"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BulkOperations } from "@/components/bulk/bulk-operations";

interface SelectableTableProps<T> {
  data: T[];
  columns: {
    key: string;
    label: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  entity: 'leads' | 'campaigns' | 'accounts';
  getItemId: (item: T) => string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function SelectableTable<T extends Record<string, any>>({
  data,
  columns,
  entity,
  getItemId,
  onRefresh,
  isLoading = false
}: SelectableTableProps<T>) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [data]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = data.map(getItemId);
      setSelectedItems(allIds);
      setSelectAll(true);
    } else {
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
      setSelectAll(false);
    }
  };

  // Update selectAll state based on individual selections
  useEffect(() => {
    if (data.length > 0 && selectedItems.length === data.length) {
      setSelectAll(true);
    } else {
      setSelectAll(false);
    }
  }, [selectedItems, data.length]);

  const clearSelection = () => {
    setSelectedItems([]);
    setSelectAll(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded mb-4"></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedItems.length > 0 && (
        <BulkOperations
          selectedItems={selectedItems}
          entity={entity}
          onClearSelection={clearSelection}
          onRefresh={onRefresh}
        />
      )}

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all items"
                />
              </TableHead>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + 1} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No {entity} found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => {
                const itemId = getItemId(item);
                const isSelected = selectedItems.includes(itemId);

                return (
                  <TableRow 
                    key={itemId}
                    className={isSelected ? "bg-primary-50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(itemId, !!checked)}
                        aria-label={`Select ${entity.slice(0, -1)} ${itemId}`}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {column.render 
                          ? column.render(item)
                          : item[column.key]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {selectedItems.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedItems.length} of {data.length} {entity} selected
        </div>
      )}
    </div>
  );
}





