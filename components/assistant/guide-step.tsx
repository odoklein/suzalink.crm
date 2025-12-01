"use client";

import { GuideStep as GuideStepType } from "@/lib/assistant-guides";
import { cn } from "@/lib/utils";
import { 
  Lightbulb, 
  AlertTriangle, 
  MousePointer, 
  Code,
  CheckCircle2
} from "lucide-react";

interface GuideStepProps {
  step: GuideStepType;
  stepNumber: number;
  totalSteps: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

export function GuideStep({
  step,
  stepNumber,
  totalSteps,
  isActive = false,
  isCompleted = false,
}: GuideStepProps) {
  return (
    <div
      className={cn(
        "relative p-4 rounded-xl transition-all duration-300",
        isActive
          ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-md"
          : isCompleted
          ? "bg-gray-50 border border-gray-100"
          : "bg-white border border-gray-100 opacity-60"
      )}
    >
      {/* Step Number Badge */}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
            isActive
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
              : isCompleted
              ? "bg-emerald-100 text-emerald-600"
              : "bg-gray-100 text-gray-400"
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            stepNumber
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Step Title */}
          <h4
            className={cn(
              "font-semibold text-base mb-1",
              isActive ? "text-gray-900" : "text-gray-600"
            )}
          >
            {step.title}
          </h4>

          {/* Step Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            {step.description}
          </p>

          {/* Action Highlight */}
          {step.action && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3">
              <MousePointer className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-blue-700 font-medium">
                {step.action}
              </span>
            </div>
          )}

          {/* Code Block */}
          {step.code && (
            <div className="relative mb-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-t-lg">
                <Code className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs text-gray-400">Raccourcis</span>
              </div>
              <pre className="p-3 bg-gray-900 rounded-b-lg overflow-x-auto">
                <code className="text-sm text-emerald-400 font-mono whitespace-pre-wrap">
                  {step.code}
                </code>
              </pre>
            </div>
          )}

          {/* Tip */}
          {step.tip && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-800">{step.tip}</span>
            </div>
          )}

          {/* Warning */}
          {step.warning && (
            <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700 font-medium">
                {step.warning}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Step Progress Line */}
      {stepNumber < totalSteps && (
        <div
          className={cn(
            "absolute left-[27px] top-[52px] w-0.5 h-[calc(100%-40px)]",
            isCompleted ? "bg-emerald-200" : "bg-gray-200"
          )}
        />
      )}
    </div>
  );
}




