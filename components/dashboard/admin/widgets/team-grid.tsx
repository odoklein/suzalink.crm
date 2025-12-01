"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Users, Activity, ArrowRight, Mail, Eye, Filter, Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { BentoCard, BentoCardHeader, BentoCardContent } from "@/components/dashboard/shared/bento-card";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface ActiveUser {
  id: string;
  email: string;
  role: string;
  lastLoginAt: string;
}

interface BdPerformance {
  id: string;
  email: string;
  leadsAssigned: number;
  bookingsThisWeek: number;
}

interface TeamGridProps {
  activeUsers: ActiveUser[] | undefined;
  bdPerformance: BdPerformance[] | undefined;
  usersByRole: Record<string, number> | undefined;
  totalUsers: number;
  usersLoggedInToday: number;
}

export function TeamGrid({ 
  activeUsers, 
  bdPerformance,
  usersByRole,
  totalUsers,
  usersLoggedInToday
}: TeamGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const getInitials = (email: string) => email.split("@")[0].slice(0, 2).toUpperCase();

  // Filter users based on search and role
  const filteredUsers = activeUsers?.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  }) || [];

  // Get unique roles
  const roles = Object.keys(usersByRole || {});

  return (
    <div className="space-y-4">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-700">Total</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{totalUsers}</p>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700">En ligne</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{usersLoggedInToday}</p>
        </div>
        {roles.slice(0, 2).map(role => (
          <div 
            key={role}
            className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-700">{role}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{usersByRole?.[role] ?? 0}</p>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          {roles.map(role => (
            <Button
              key={role}
              variant={roleFilter === role ? "default" : "outline"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setRoleFilter(roleFilter === role ? null : role)}
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      {/* Team Matrix */}
      <BentoCard size="full" gradient="green" delay={0} className="min-h-0">
        <BentoCardHeader
          icon={<Activity className="h-4 w-4 text-green-600" />}
          title="Équipe active"
          subtitle={`${filteredUsers.length} utilisateurs`}
          iconBg="bg-green-100"
          action={
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                Gérer
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          }
        />
        <BentoCardContent>
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {filteredUsers.map((user) => {
                const performance = bdPerformance?.find(bd => bd.id === user.id);
                
                return (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs bg-blue-100 text-blue-700 font-semibold">
                            {getInitials(user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email.split("@")[0]}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            {user.role}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {format(new Date(user.lastLoginAt), "HH:mm", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {performance && (
                        <Badge className="text-[9px] h-5 bg-purple-100 text-purple-700 border-purple-200">
                          {performance.bookingsThisWeek} RDV
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-center">
              <Users className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchQuery || roleFilter ? "Aucun résultat" : "Aucun utilisateur actif"}
              </p>
            </div>
          )}
        </BentoCardContent>
      </BentoCard>
    </div>
  );
}

// Skeleton loader
export function TeamGridSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
