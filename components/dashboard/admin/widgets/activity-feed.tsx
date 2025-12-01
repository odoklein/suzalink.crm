"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, Clock, CheckCircle, ChevronDown, ChevronUp, 
  Activity, ArrowRight, Plus, Users, Megaphone, BarChart3,
  Settings, FileText, Phone, Mail, ExternalLink, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface BookingDetail {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  approvalStatus: string;
  userName: string;
  leadName: string;
  campaignName: string;
}

interface BdPerformance {
  id: string;
  email: string;
  leadsAssigned: number;
  bookingsThisWeek: number;
}

interface CampaignBooking {
  name: string;
  count: number;
}

interface ActivityFeedProps {
  bookings: BookingDetail[] | undefined;
  todayCount: number;
  bdPerformance?: BdPerformance[];
  topCampaigns?: CampaignBooking[];
  isCollapsible?: boolean;
  defaultCollapsed?: boolean;
  maxItems?: number;
}

// Quick action items
const quickActions = [
  { href: "/admin/users/new", icon: Plus, label: "Nouvel utilisateur", color: "blue" },
  { href: "/campaigns/new", icon: Megaphone, label: "Nouvelle campagne", color: "purple" },
  { href: "/calendar", icon: Calendar, label: "Calendrier", color: "cyan" },
  { href: "/planning", icon: Users, label: "Planning BD", color: "emerald" },
  { href: "/reports", icon: BarChart3, label: "Rapports", color: "amber" },
  { href: "/settings", icon: Settings, label: "Paramètres", color: "gray" },
];

export function ActivityFeed({ 
  bookings, 
  todayCount, 
  bdPerformance,
  topCampaigns,
  isCollapsible = false,
  defaultCollapsed = false,
  maxItems = 6
}: ActivityFeedProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const displayedBookings = bookings?.slice(0, maxItems) || [];
  const getInitials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Main Activity Timeline */}
      <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">RDV à venir</h3>
                <p className="text-xs text-muted-foreground">Prochains rendez-vous programmés</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-100 text-violet-700 border-violet-200">
                {todayCount} aujourd'hui
              </Badge>
              <Link href="/calendar">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                  Voir tout
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        <div className="p-4">
          {displayedBookings.length > 0 ? (
            <div className="space-y-3">
              {displayedBookings.map((b, index) => {
                const bookingDate = new Date(b.startTime);
                const isToday = bookingDate.toDateString() === new Date().toDateString();
                const isPast = bookingDate < new Date();
                const timeFromNow = formatDistanceToNow(bookingDate, { addSuffix: true, locale: fr });
                
                return (
                  <div 
                    key={b.id} 
                    className={cn(
                      "flex items-center gap-4 p-3 rounded-xl transition-all hover:bg-gray-50 group",
                      isToday && !isPast && "bg-violet-50/50 border border-violet-100",
                      isPast && "opacity-60"
                    )}
                  >
                    {/* Time indicator */}
                    <div className="flex flex-col items-center w-14 shrink-0">
                      <span className="text-lg font-bold text-gray-900">
                        {format(bookingDate, "HH:mm", { locale: fr })}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase">
                        {format(bookingDate, "EEE", { locale: fr })}
                      </span>
                    </div>
                    
                    {/* Divider */}
                    <div className={cn(
                      "w-1 h-12 rounded-full",
                      isToday && !isPast ? "bg-violet-400" : isPast ? "bg-gray-200" : "bg-gray-300"
                    )} />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {b.leadName || "N/A"}
                        </p>
                        {isToday && !isPast && (
                          <Badge className="text-[9px] h-4 px-1.5 bg-violet-100 text-violet-700 border-violet-200">
                            {timeFromNow}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {b.campaignName}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {b.userName.split("@")[0]}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {b.approvalStatus === "on_hold" ? (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200">
                          <Clock className="h-3 w-3 mr-1" />
                          En attente
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Confirmé
                        </Badge>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900 mb-1">Aucun RDV programmé</p>
              <p className="text-sm text-muted-foreground mb-4">Les prochains rendez-vous apparaîtront ici</p>
              <Link href="/calendar">
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Planifier un RDV
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Quick Actions & Top Performers */}
      <div className="space-y-4">
        {/* Quick Actions */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Actions rapides</h3>
                <p className="text-xs text-muted-foreground">Accès direct</p>
              </div>
            </div>
          </div>
          <div className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full h-auto py-3 px-3 flex flex-col items-center gap-2 rounded-xl transition-all",
                      "hover:bg-gray-50 hover:shadow-sm"
                    )}
                  >
                    <div className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center",
                      action.color === "blue" && "bg-blue-100",
                      action.color === "purple" && "bg-purple-100",
                      action.color === "cyan" && "bg-cyan-100",
                      action.color === "emerald" && "bg-emerald-100",
                      action.color === "amber" && "bg-amber-100",
                      action.color === "gray" && "bg-gray-100",
                    )}>
                      <action.icon className={cn(
                        "h-4 w-4",
                        action.color === "blue" && "text-blue-600",
                        action.color === "purple" && "text-purple-600",
                        action.color === "cyan" && "text-cyan-600",
                        action.color === "emerald" && "text-emerald-600",
                        action.color === "amber" && "text-amber-600",
                        action.color === "gray" && "text-gray-600",
                      )} />
                    </div>
                    <span className="text-[11px] font-medium text-gray-700 text-center leading-tight">
                      {action.label}
                    </span>
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performers Mini */}
        {bdPerformance && bdPerformance.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                    <span className="text-sm">🏆</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">Top BD</h3>
                </div>
                <Link href="/admin/users">
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Voir
                  </Button>
                </Link>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {bdPerformance.slice(0, 3).map((bd, i) => (
                <div 
                  key={bd.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-gray-100 font-semibold">
                      {getInitials(bd.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">
                      {bd.email.split("@")[0]}
                    </p>
                  </div>
                  <Badge className="text-[10px] h-5 bg-amber-100 text-amber-700 border-amber-200">
                    {bd.bookingsThisWeek} RDV
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Skeleton loader
export function ActivityFeedSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 rounded-2xl bg-white border border-gray-100 p-4 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-violet-200" />
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded mt-1" />
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
              <div className="w-14 h-10 bg-gray-200 rounded" />
              <div className="w-1 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded mt-2" />
              </div>
              <div className="h-6 w-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="rounded-2xl bg-white border border-gray-100 p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-blue-200" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
