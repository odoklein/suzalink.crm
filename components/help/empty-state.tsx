"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline";
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-[#E6E8EB]">
      <CardContent className="py-12 px-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#F1F5F3] flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-[#6B7280]" />
          </div>
          <h3 className="text-h3 font-semibold text-[#1B1F24] mb-2">{title}</h3>
          <p className="text-body text-[#6B7280] mb-6 max-w-md mx-auto">{description}</p>
          {action && (
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={action.onClick}
                variant={action.variant || "default"}
                className="rounded-[12px]"
              >
                {action.label}
              </Button>
              {secondaryAction && (
                <Button
                  onClick={secondaryAction.onClick}
                  variant="ghost"
                  className="rounded-[12px]"
                >
                  {secondaryAction.label}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}



