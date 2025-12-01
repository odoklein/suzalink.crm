"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Zap,
  Plus,
  Users,
  FileText,
  MessageSquare,
  Settings,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface QuickAction {
  label: string;
  icon: typeof Plus;
  href: string;
  color: string;
  bgColor: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Nouvelle campagne",
    icon: Plus,
    href: "/campaigns/new",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    label: "Assigner leads",
    icon: Users,
    href: "/campaigns",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    label: "Générer rapport",
    icon: FileText,
    href: "/reports",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  {
    label: "Message équipe",
    icon: MessageSquare,
    href: "/communication",
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
];

export function QuickActionsAdmin() {
  return (
    <BentoCard size="sm" gradient="none" delay={300} className="!min-h-[180px]">
      <BentoCardHeader
        icon={<Zap className="h-5 w-5 text-primary-600" />}
        title="Actions rapides"
        iconBg="bg-primary-100"
      />

      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl",
                "hover:bg-gray-50 transition-colors group",
                "border border-gray-100 hover:border-gray-200"
              )}
            >
              <div
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                  action.bgColor
                )}
              >
                <Icon className={cn("h-4 w-4", action.color)} />
              </div>
              <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900 truncate">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </BentoCard>
  );
}




