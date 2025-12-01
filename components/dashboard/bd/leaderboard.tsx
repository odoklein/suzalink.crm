"use client";

import { BentoCard, BentoCardHeader } from "@/components/dashboard/shared/bento-card";
import { cn } from "@/lib/utils";
import { Trophy, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  change: number; // Position change from last period
  isCurrentUser: boolean;
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId: string;
  period?: "day" | "week" | "month";
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-amber-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-700" />;
  return <span className="text-xs font-bold text-gray-400">{rank}</span>;
}

function getChangeIcon(change: number) {
  if (change > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
  if (change < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
  return <Minus className="h-3 w-3 text-gray-400" />;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Leaderboard({
  entries,
  currentUserId,
  period = "week",
}: LeaderboardProps) {
  const periodLabels = {
    day: "Aujourd'hui",
    week: "Cette semaine",
    month: "Ce mois",
  };

  const currentUserRank = entries.findIndex((e) => e.id === currentUserId) + 1;

  return (
    <BentoCard size="md" gradient="amber" delay={250}>
      <BentoCardHeader
        icon={<Trophy className="h-5 w-5 text-amber-600" />}
        title="Classement"
        subtitle={periodLabels[period]}
        iconBg="bg-amber-100"
      />

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-8">
          <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Trophy className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">Aucune donnée</p>
        </div>
      ) : (
        <>
          {/* Current user highlight if not in top 5 */}
          {currentUserRank > 5 && (
            <div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-100">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-600">
                    {currentUserRank}
                  </span>
                </div>
                <span className="text-sm font-medium text-primary-700">
                  Votre position
                </span>
              </div>
            </div>
          )}

          {/* Top entries */}
          <div className="space-y-1 -mx-1">
            {entries.slice(0, 5).map((entry, index) => {
              const rank = index + 1;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors",
                    entry.isCurrentUser
                      ? "bg-primary-50 border border-primary-100"
                      : "hover:bg-gray-50"
                  )}
                >
                  {/* Rank */}
                  <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  {entry.avatar ? (
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold",
                        entry.isCurrentUser
                          ? "bg-primary-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}
                    >
                      {getInitials(entry.name)}
                    </div>
                  )}

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "text-sm font-medium truncate block",
                        entry.isCurrentUser ? "text-primary-700" : "text-gray-900"
                      )}
                    >
                      {entry.name}
                      {entry.isCurrentUser && (
                        <span className="text-xs text-primary-500 ml-1">(vous)</span>
                      )}
                    </span>
                  </div>

                  {/* Score & Change */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-900 tabular-nums">
                      {entry.score}
                    </span>
                    <div className="flex items-center gap-0.5">
                      {getChangeIcon(entry.change)}
                      {entry.change !== 0 && (
                        <span
                          className={cn(
                            "text-[10px] font-medium",
                            entry.change > 0 ? "text-emerald-600" : "text-red-500"
                          )}
                        >
                          {Math.abs(entry.change)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </BentoCard>
  );
}


