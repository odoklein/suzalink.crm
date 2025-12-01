"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { Sparkline } from "@/components/dashboard/shared/sparkline";
import { MiniProgressRing } from "@/components/dashboard/shared/progress-ring";
import { cn } from "@/lib/utils";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Phone,
  Target,
  Calendar,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  stats: {
    calls: number;
    callsTrend: number[];
    leadsQualified: number;
    conversionRate: number;
    meetings: number;
  };
  performance: number; // 0-100
  status: "active" | "inactive" | "break";
}

interface TeamMatrixProps {
  members: TeamMember[];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusConfig = {
  active: { label: "En ligne", color: "bg-emerald-500" },
  inactive: { label: "Hors ligne", color: "bg-gray-400" },
  break: { label: "Pause", color: "bg-amber-500" },
};

export function TeamMatrix({ members }: TeamMatrixProps) {
  const sortedMembers = [...members].sort((a, b) => b.performance - a.performance);

  return (
    <BentoCard size="xl" gradient="purple" glass delay={100} className="col-span-3">
      <BentoCardHeader
        icon={<Users className="h-5 w-5 text-purple-600" />}
        title="Performance équipe"
        subtitle={`${members.length} membres actifs`}
        iconBg="bg-purple-100"
        action={
          <Link
            href="/admin/users"
            className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
          >
            Gérer l'équipe
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        <div className="col-span-3">Membre</div>
        <div className="col-span-2 text-center">Appels</div>
        <div className="col-span-2 text-center">Qualifiés</div>
        <div className="col-span-2 text-center">Conversion</div>
        <div className="col-span-2 text-center">RDV</div>
        <div className="col-span-1 text-center">Score</div>
      </div>

      {/* Table Body */}
      <div className="space-y-1 mt-2">
        {sortedMembers.map((member, index) => (
          <Link
            key={member.id}
            href={`/admin/users/${member.id}`}
            className={cn(
              "grid grid-cols-12 gap-4 px-3 py-3 items-center rounded-xl",
              "hover:bg-gray-50 transition-colors group",
              "animate-in fade-in-0 slide-in-from-bottom-2"
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Member Info */}
            <div className="col-span-3 flex items-center gap-3">
              <div className="relative">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                    {getInitials(member.name)}
                  </div>
                )}
                {/* Status indicator */}
                <div
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white",
                    statusConfig[member.status].color
                  )}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                  {member.name}
                </p>
                <p className="text-xs text-gray-500">{member.role}</p>
              </div>
            </div>

            {/* Calls with sparkline */}
            <div className="col-span-2 flex items-center justify-center gap-2">
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {member.stats.calls}
              </span>
              <Sparkline
                data={member.stats.callsTrend}
                width={50}
                height={20}
                color="primary"
                showArea={false}
              />
            </div>

            {/* Qualified Leads */}
            <div className="col-span-2 text-center">
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {member.stats.leadsQualified}
              </span>
            </div>

            {/* Conversion Rate */}
            <div className="col-span-2 flex items-center justify-center gap-1">
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {member.stats.conversionRate}%
              </span>
              {member.stats.conversionRate >= 20 ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>

            {/* Meetings */}
            <div className="col-span-2 text-center">
              <span className="text-sm font-semibold text-gray-900 tabular-nums">
                {member.stats.meetings}
              </span>
            </div>

            {/* Performance Score */}
            <div className="col-span-1 flex justify-center">
              <MiniProgressRing
                value={member.performance}
                size={32}
                color={
                  member.performance >= 80
                    ? "success"
                    : member.performance >= 60
                    ? "warning"
                    : "danger"
                }
              />
            </div>
          </Link>
        ))}
      </div>
    </BentoCard>
  );
}




