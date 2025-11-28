"use client";

import { useState, useEffect, useRef } from "react";
import {
  Check,
  X,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface ImportError {
  row: number;
  reason: string;
  data?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  processed: number;
  errors: number;
  errorDetails?: ImportError[];
}

interface ImportProgressProps {
  isImporting: boolean;
  progress?: number;
  result?: ImportResult | null;
  onRetry?: () => void;
  onViewLeads?: () => void;
  onImportAnother?: () => void;
  onExportErrors?: () => void;
}

// Animated circular progress
function CircularProgress({ 
  value, 
  size = 120,
  strokeWidth = 8,
  isComplete = false,
  hasErrors = false,
}: { 
  value: number; 
  size?: number;
  strokeWidth?: number;
  isComplete?: boolean;
  hasErrors?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Background circle */}
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-gray-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn(
            "transition-all duration-500 ease-out",
            isComplete 
              ? hasErrors 
                ? "text-warning-500" 
                : "text-success-500"
              : "text-primary-500"
          )}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isComplete ? (
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300",
            hasErrors ? "bg-warning-100" : "bg-success-100"
          )}>
            {hasErrors ? (
              <AlertTriangle className="h-6 w-6 text-warning-600" />
            ) : (
              <Check className="h-6 w-6 text-success-600" />
            )}
          </div>
        ) : (
          <div className="text-center">
            <span className="text-2xl font-bold text-text-main">{Math.round(value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Animated counter
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Error row component
function ErrorRow({ error, index }: { error: ImportError; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all duration-200",
        "bg-destructive-50/30 border-destructive-200",
        "animate-in fade-in slide-in-from-right-2 duration-300"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-destructive-100 flex items-center justify-center">
              <X className="h-3 w-3 text-destructive-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-destructive-700">
                Row {error.row}
              </p>
              <p className="text-xs text-destructive-600 truncate max-w-[300px]">
                {error.reason}
              </p>
            </div>
          </div>
          {error.data && (
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-400 transition-transform",
              isExpanded && "rotate-180"
            )} />
          )}
        </CollapsibleTrigger>

        {error.data && (
          <CollapsibleContent className="pt-3 mt-3 border-t border-destructive-200">
            <div className="bg-white rounded p-2 text-xs font-mono overflow-x-auto">
              <pre className="text-text-body">
                {JSON.stringify(error.data, null, 2)}
              </pre>
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

// Live activity feed
function ActivityFeed({ 
  processed, 
  errors,
  isComplete,
}: { 
  processed: number;
  errors: number;
  isComplete: boolean;
}) {
  const activities = [
    { icon: FileSpreadsheet, text: "File uploaded", done: true },
    { icon: Check, text: "Mappings validated", done: true },
    { icon: Loader2, text: `Processing rows... ${processed} completed`, done: isComplete, spinning: !isComplete },
    { icon: errors > 0 ? AlertTriangle : Check, text: isComplete 
      ? errors > 0 
        ? `Completed with ${errors} errors` 
        : "Import successful!"
      : "Finalizing...", 
      done: isComplete,
      isError: errors > 0 && isComplete
    },
  ];

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => {
        const Icon = activity.icon;
        const shouldShow = index <= (isComplete ? 3 : 2);
        
        if (!shouldShow) return null;

        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 text-sm transition-all duration-300",
              "animate-in fade-in slide-in-from-left-4",
              !activity.done && "opacity-50"
            )}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={cn(
              "h-6 w-6 rounded-full flex items-center justify-center",
              activity.done 
                ? activity.isError 
                  ? "bg-warning-100"
                  : "bg-success-100" 
                : "bg-gray-100"
            )}>
              <Icon className={cn(
                "h-3.5 w-3.5",
                activity.spinning && "animate-spin",
                activity.done 
                  ? activity.isError 
                    ? "text-warning-600"
                    : "text-success-600" 
                  : "text-gray-400"
              )} />
            </div>
            <span className={cn(
              activity.done 
                ? activity.isError 
                  ? "text-warning-700"
                  : "text-text-main" 
                : "text-text-body"
            )}>
              {activity.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function ImportProgress({
  isImporting,
  progress = 0,
  result,
  onRetry,
  onViewLeads,
  onImportAnother,
  onExportErrors,
}: ImportProgressProps) {
  const [showAllErrors, setShowAllErrors] = useState(false);
  const isComplete = !isImporting && result !== null;
  const hasErrors = result?.errors ? result.errors > 0 : false;
  const successRate = result 
    ? Math.round((result.processed / (result.processed + result.errors)) * 100) 
    : 0;

  // Exporting errors
  const handleExportErrors = () => {
    if (!result?.errorDetails) return;
    
    const csvContent = [
      ["Row", "Reason", "Data"],
      ...result.errorDetails.map(e => [
        e.row.toString(),
        e.reason,
        e.data ? JSON.stringify(e.data) : ""
      ])
    ].map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // During import
  if (isImporting) {
    return (
      <div className="py-12 animate-in fade-in duration-500">
        <div className="flex flex-col items-center text-center">
          {/* Circular progress */}
          <div className="relative mb-6">
            <CircularProgress value={progress} size={140} strokeWidth={10} />
            
            {/* Pulsing outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-primary-200 animate-pulse opacity-30" 
              style={{ margin: "-8px" }} 
            />
          </div>

          <h3 className="text-xl font-semibold text-text-main mb-2">
            Importing your data...
          </h3>
          <p className="text-text-body mb-8 max-w-md">
            We're processing your CSV file and creating leads. This may take a few moments for large files.
          </p>

          {/* Activity feed */}
          <div className="bg-gray-50 rounded-xl p-6 w-full max-w-sm">
            <ActivityFeed 
              processed={Math.round((progress / 100) * 1000)} 
              errors={0}
              isComplete={false}
            />
          </div>
        </div>
      </div>
    );
  }

  // Import complete
  if (isComplete && result) {
    const displayedErrors = showAllErrors 
      ? result.errorDetails 
      : result.errorDetails?.slice(0, 5);

    return (
      <div className="py-8 animate-in fade-in duration-500">
        <div className="space-y-8">
          {/* Success header */}
          <div className="flex flex-col items-center text-center">
            <CircularProgress 
              value={100} 
              size={120} 
              strokeWidth={8}
              isComplete={true}
              hasErrors={hasErrors}
            />
            
            <h3 className="text-xl font-semibold text-text-main mt-6 mb-2">
              {hasErrors ? "Import Completed with Issues" : "Import Successful!"}
            </h3>
            <p className="text-text-body max-w-md">
              {hasErrors 
                ? `${result.processed} leads were imported successfully. ${result.errors} rows had issues.`
                : `All ${result.processed} leads have been imported successfully.`
              }
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 rounded-xl bg-success-50 border border-success-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="text-3xl font-bold text-success-600 mb-1">
                <AnimatedNumber value={result.processed} />
              </div>
              <p className="text-sm text-success-700">Leads Imported</p>
            </div>

            <div className={cn(
              "p-5 rounded-xl border text-center animate-in fade-in slide-in-from-bottom-4 duration-300",
              hasErrors 
                ? "bg-destructive-50 border-destructive-200" 
                : "bg-gray-50 border-gray-200"
            )} style={{ animationDelay: "100ms" }}>
              <div className={cn(
                "text-3xl font-bold mb-1",
                hasErrors ? "text-destructive-600" : "text-gray-400"
              )}>
                <AnimatedNumber value={result.errors} />
              </div>
              <p className={cn(
                "text-sm",
                hasErrors ? "text-destructive-700" : "text-gray-500"
              )}>Errors</p>
            </div>

            <div className="p-5 rounded-xl bg-primary-50 border border-primary-200 text-center animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: "200ms" }}>
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {successRate}%
              </div>
              <p className="text-sm text-primary-700">Success Rate</p>
            </div>
          </div>

          {/* Error details */}
          {hasErrors && result.errorDetails && result.errorDetails.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: "300ms" }}>
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-text-main flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive-500" />
                  Error Details
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportErrors}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export Errors
                </Button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {displayedErrors?.map((error, index) => (
                  <ErrorRow key={index} error={error} index={index} />
                ))}
              </div>

              {result.errorDetails.length > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllErrors(!showAllErrors)}
                  className="w-full"
                >
                  {showAllErrors ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1.5" />
                      Show All {result.errorDetails.length} Errors
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <Button variant="outline" onClick={onImportAnother}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Import Another File
            </Button>
            <Button onClick={onViewLeads}>
              View Leads
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          {/* Success celebration */}
          {!hasErrors && (
            <div className="flex items-center justify-center gap-2 text-sm text-success-600 animate-in fade-in duration-1000" style={{ animationDelay: "500ms" }}>
              <Sparkles className="h-4 w-4" />
              <span>Perfect import! All rows processed without errors.</span>
              <Sparkles className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default state (shouldn't normally be seen)
  return (
    <div className="py-12 text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
      <p className="text-text-body mt-4">Preparing import...</p>
    </div>
  );
}

