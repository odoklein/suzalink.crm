"use client";

import { useState, useMemo } from "react";
import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Calendar,
  Mail,
  Phone,
  Link,
  CheckSquare,
  ChevronDown,
  Tags,
  AlertTriangle,
  Info,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Columns,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ColumnStatistics, 
  ColumnIssue,
  analyzeAllColumns,
} from "./smart-mapper";
import { SchemaField } from "@/components/campaigns/schema-config-editor";

interface DataPreviewTableProps {
  headers: string[];
  data: Record<string, string>[];
  totalRows?: number;
  onContinue?: () => void;
  className?: string;
}

const TYPE_ICONS: Record<SchemaField["type"], typeof Type> = {
  text: Type,
  textarea: AlignLeft,
  number: Hash,
  currency: DollarSign,
  date: Calendar,
  email: Mail,
  phone: Phone,
  url: Link,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  tags: Tags,
};

const TYPE_COLORS: Record<SchemaField["type"], string> = {
  text: "bg-gray-100 text-gray-600 border-gray-200",
  textarea: "bg-gray-100 text-gray-600 border-gray-200",
  number: "bg-blue-50 text-blue-600 border-blue-200",
  currency: "bg-emerald-50 text-emerald-600 border-emerald-200",
  date: "bg-purple-50 text-purple-600 border-purple-200",
  email: "bg-sky-50 text-sky-600 border-sky-200",
  phone: "bg-teal-50 text-teal-600 border-teal-200",
  url: "bg-indigo-50 text-indigo-600 border-indigo-200",
  checkbox: "bg-amber-50 text-amber-600 border-amber-200",
  dropdown: "bg-violet-50 text-violet-600 border-violet-200",
  tags: "bg-pink-50 text-pink-600 border-pink-200",
};

function IssueIndicator({ issues }: { issues: ColumnIssue[] }) {
  if (issues.length === 0) return null;

  const hasError = issues.some(i => i.severity === "error");
  const hasWarning = issues.some(i => i.severity === "warning");

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center justify-center h-5 w-5 rounded-full",
            hasError ? "bg-destructive-100 text-destructive-500" :
            hasWarning ? "bg-warning-100 text-warning-600" :
            "bg-primary-100 text-primary-500"
          )}>
            {hasError ? (
              <AlertCircle className="h-3 w-3" />
            ) : hasWarning ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <Info className="h-3 w-3" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            {issues.map((issue, idx) => (
              <p key={idx} className="text-xs">
                {issue.message}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TypeBadge({ type, confidence }: { type: SchemaField["type"]; confidence: number }) {
  const Icon = TYPE_ICONS[type] || Type;
  const colorClass = TYPE_COLORS[type] || TYPE_COLORS.text;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border",
            colorClass
          )}>
            <Icon className="h-3 w-3" />
            <span className="capitalize">{type}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="text-xs">
            Detected as {type} ({Math.round(confidence * 100)}% confidence)
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ColumnHeader({ 
  column, 
  stats,
  index,
}: { 
  column: string; 
  stats: ColumnStatistics;
  index: number;
}) {
  return (
    <th 
      className={cn(
        "sticky top-0 z-10 bg-gray-50 px-4 py-3 text-left border-b border-r border-gray-200",
        "animate-in fade-in slide-in-from-top-2 duration-300"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className="space-y-2">
        {/* Column name and issues */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-text-main truncate max-w-[150px]">
            {column}
          </span>
          <IssueIndicator issues={stats.issues} />
        </div>

        {/* Type badge */}
        <TypeBadge type={stats.detectedType} confidence={stats.typeConfidence} />

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-text-body">
          <span>{stats.uniqueValues} unique</span>
          {stats.emptyValues > 0 && (
            <span className="text-warning-600">
              {stats.emptyValues} empty
            </span>
          )}
        </div>
      </div>
    </th>
  );
}

export function DataPreviewTable({
  headers,
  data,
  totalRows,
  className,
}: DataPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set(headers));
  const [currentPage, setCurrentPage] = useState(0);
  const rowsPerPage = 5;

  // Analyze column data
  const columnStats = useMemo(() => {
    return analyzeAllColumns(headers, data);
  }, [headers, data]);

  // Filter columns based on search
  const filteredHeaders = useMemo(() => {
    if (!searchTerm) return headers.filter(h => visibleColumns.has(h));
    return headers.filter(h => 
      h.toLowerCase().includes(searchTerm.toLowerCase()) && 
      visibleColumns.has(h)
    );
  }, [headers, searchTerm, visibleColumns]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = currentPage * rowsPerPage;
    return data.slice(start, start + rowsPerPage);
  }, [data, currentPage]);

  const totalPages = Math.ceil(data.length / rowsPerPage);

  // Summary stats
  const summaryStats = useMemo(() => {
    const totalIssues = columnStats.reduce((acc, s) => acc + s.issues.length, 0);
    const columnsWithIssues = columnStats.filter(s => s.issues.length > 0).length;
    const emptyRate = columnStats.reduce((acc, s) => acc + s.emptyValues, 0) / 
      (columnStats.length * data.length) * 100;

    return { totalIssues, columnsWithIssues, emptyRate };
  }, [columnStats, data.length]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { 
            label: "Columns", 
            value: headers.length, 
            icon: Columns,
            color: "bg-primary-50 text-primary-600 border-primary-200" 
          },
          { 
            label: "Rows", 
            value: totalRows || data.length, 
            icon: AlignLeft,
            color: "bg-emerald-50 text-emerald-600 border-emerald-200" 
          },
          { 
            label: "Issues", 
            value: summaryStats.totalIssues, 
            icon: AlertTriangle,
            color: summaryStats.totalIssues > 0 
              ? "bg-warning-50 text-warning-600 border-warning-200" 
              : "bg-success-50 text-success-600 border-success-200"
          },
          { 
            label: "Empty Rate", 
            value: `${summaryStats.emptyRate.toFixed(1)}%`, 
            icon: Info,
            color: summaryStats.emptyRate > 20 
              ? "bg-warning-50 text-warning-600 border-warning-200"
              : "bg-gray-50 text-gray-600 border-gray-200"
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "p-3 rounded-lg border transition-all duration-300",
              stat.color,
              "animate-in fade-in slide-in-from-bottom-2"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 opacity-70" />
              <span className="text-xs font-medium opacity-70">{stat.label}</span>
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Badge variant="outline" className="text-xs">
          Showing {filteredHeaders.length} of {headers.length} columns
        </Badge>
      </div>

      {/* Data Table */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {/* Row number column */}
                <th className="sticky top-0 left-0 z-20 bg-gray-100 px-3 py-3 text-left border-b border-r border-gray-200 w-12">
                  <span className="text-xs font-medium text-gray-500">#</span>
                </th>
                {filteredHeaders.map((header, index) => {
                  const stats = columnStats.find(s => s.column === header);
                  return stats ? (
                    <ColumnHeader
                      key={header}
                      column={header}
                      stats={stats}
                      index={index}
                    />
                  ) : null;
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={cn(
                    "transition-colors hover:bg-gray-50",
                    "animate-in fade-in slide-in-from-left-2 duration-300"
                  )}
                  style={{ animationDelay: `${rowIndex * 30}ms` }}
                >
                  {/* Row number */}
                  <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 border-b border-r border-gray-100 text-xs text-gray-400 font-mono">
                    {currentPage * rowsPerPage + rowIndex + 1}
                  </td>
                  {filteredHeaders.map((header) => {
                    const value = row[header] || "";
                    const isEmpty = !value || value.trim() === "";
                    
                    return (
                      <td 
                        key={header}
                        className={cn(
                          "px-4 py-2.5 border-b border-r border-gray-100 text-sm",
                          isEmpty && "bg-amber-50/30"
                        )}
                      >
                        {isEmpty ? (
                          <span className="text-xs text-gray-300 italic">empty</span>
                        ) : (
                          <span className="text-text-main truncate block max-w-[200px]">
                            {value}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <p className="text-sm text-text-body">
              Showing {currentPage * rowsPerPage + 1} to {Math.min((currentPage + 1) * rowsPerPage, data.length)} of {data.length} preview rows
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-text-body">
                {currentPage + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Column Issues Summary */}
      {summaryStats.columnsWithIssues > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800">
                {summaryStats.columnsWithIssues} column{summaryStats.columnsWithIssues > 1 ? "s" : ""} with potential issues
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                Review the column headers above to see detected issues. You can proceed with the import, but some data may need attention.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

