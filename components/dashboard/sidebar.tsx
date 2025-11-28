"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "./sidebar-context";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  FolderKanban,
  Building2,
  GitBranch,
  Megaphone,
  MessageSquare,
  Workflow,
  Mail,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarRange,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

type Campaign = {
  id: string;
  name: string;
};

const navigationGroups = [
  {
    title: "Vue d'ensemble",
    items: [
      { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER", "BD", "DEVELOPER"] },
      { name: "Tâches", href: "/tasks", icon: Calendar, roles: ["ADMIN", "MANAGER", "BD", "DEVELOPER"] },
      { name: "Projets", href: "/projects", icon: FolderKanban, roles: ["ADMIN", "MANAGER", "BD", "DEVELOPER"] },
    ],
  },
  {
    title: "Ventes & CRM",
    items: [
      { name: "Comptes", href: "/accounts", icon: Building2, roles: ["ADMIN", "MANAGER"] },
      { name: "Prospection", href: "/campaigns", icon: GitBranch, roles: ["ADMIN", "MANAGER", "BD"], isProspection: true },
      { name: "Campagnes", href: "/campaigns", icon: Megaphone, roles: ["ADMIN", "MANAGER", "BD"] },
      { name: "Planning", href: "/planning", icon: CalendarRange, roles: ["ADMIN", "MANAGER"] },
    ],
  },
  {
    title: "Communication",
    items: [
      { name: "Messages", href: "/communication", icon: MessageSquare, roles: ["ADMIN", "MANAGER", "BD", "DEVELOPER"] },
      { name: "Boîte de réception", href: "/inbox", icon: Mail, roles: ["ADMIN", "MANAGER", "BD"] },
    ],
  },
  {
    title: "Administration",
    items: [
      { name: "Utilisateurs", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
      { name: "Paramètres", href: "/settings", icon: Settings, roles: ["ADMIN"] },
    ],
  },
];

// Navigation Item Component
function NavItem({
  item,
  isActive,
  isCollapsed,
  index,
}: {
  item: typeof navigationGroups[0]["items"][0];
  isActive: boolean;
  isCollapsed: boolean;
  index: number;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer",
        isCollapsed ? "justify-center w-11 h-11 mx-auto" : "px-3 py-2.5",
        isActive
          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/10"
          : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Active indicator glow */}
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-primary-500/5 blur-md -z-10" />
      )}

      {/* Icon */}
      <item.icon
        className={cn(
          "shrink-0 transition-all duration-200",
          isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
          isActive 
            ? "text-white" 
            : "text-gray-500 group-hover:text-gray-700"
        )}
      />

      {/* Label */}
      {!isCollapsed && (
        <span
          className={cn(
            "text-sm font-medium truncate transition-all duration-200",
            isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
          )}
        >
          {item.name}
        </span>
      )}

      {/* Hover effect bar */}
      {!isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-primary-500 rounded-r-full transition-all duration-200 group-hover:h-5" />
      )}
    </div>
  );
}

// Prospection Dropdown Item
function ProspectionItem({
  item,
  isActive,
  isCollapsed,
  assignedCampaigns,
  onCampaignClick,
  prospectionOpen,
  setProspectionOpen,
}: {
  item: typeof navigationGroups[0]["items"][0];
  isActive: boolean;
  isCollapsed: boolean;
  assignedCampaigns: Campaign[];
  onCampaignClick: (id: string) => void;
  prospectionOpen: boolean;
  setProspectionOpen: (open: boolean) => void;
}) {
  const content = (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer w-full",
        isCollapsed ? "justify-center w-11 h-11 mx-auto" : "px-3 py-2.5",
        isActive
          ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/10"
          : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
      )}
    >
      {isActive && (
        <div className="absolute inset-0 rounded-xl bg-primary-500/5 blur-md -z-10" />
      )}

      <item.icon
        className={cn(
          "shrink-0 transition-all duration-200",
          isCollapsed ? "h-5 w-5" : "h-[18px] w-[18px]",
          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
        )}
      />

      {!isCollapsed && (
        <>
          <span
            className={cn(
              "text-sm font-medium truncate transition-all duration-200 flex-1",
              isActive ? "text-white" : "text-gray-600 group-hover:text-gray-900"
            )}
          >
            {item.name}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isActive ? "text-white/80" : "text-gray-400",
              prospectionOpen && "rotate-180"
            )}
          />
        </>
      )}

      {!isActive && !isCollapsed && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 bg-primary-500 rounded-r-full transition-all duration-200 group-hover:h-5" />
      )}
    </div>
  );

  return (
    <DropdownMenu open={prospectionOpen} onOpenChange={setProspectionOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full outline-none">{content}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-56"
      >
        {assignedCampaigns.length === 0 ? (
          <DropdownMenuItem disabled className="text-gray-400">
            <Sparkles className="h-4 w-4 mr-2 opacity-50" />
            Aucune campagne assignée
          </DropdownMenuItem>
        ) : (
          assignedCampaigns.map((campaign) => (
            <DropdownMenuItem
              key={campaign.id}
              onClick={() => onCampaignClick(campaign.id)}
            >
              <Megaphone className="h-4 w-4 mr-2 opacity-60" />
              {campaign.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [prospectionOpen, setProspectionOpen] = useState(false);

  const userRole = session?.user?.role || "BD";

  // Fetch assigned campaigns for prospection dropdown
  const { data: assignedCampaigns = [] } = useQuery<Campaign[]>({
    queryKey: ["assigned-campaigns", session?.user?.id],
    queryFn: async () => {
      const res = await fetch("/api/campaigns/assigned");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const handleProspectionClick = (campaignId: string) => {
    router.push(`/campaigns/${campaignId}/leads`);
    setProspectionOpen(false);
  };

  // Filter navigation groups based on user role
  const filteredGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(userRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40",
        "bg-white/95 backdrop-blur-xl",
        "border-r border-gray-200/60",
        "transition-all duration-300 ease-out",
        isCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-transparent to-gray-50/30 pointer-events-none" />

      <div className="relative flex h-full flex-col">
        {/* Header */}
        <div
          className={cn(
            "flex items-center border-b border-gray-100",
            "transition-all duration-300",
            isCollapsed ? "h-16 justify-center px-3" : "h-16 px-5"
          )}
        >
          {isCollapsed ? (
            <div className="relative flex items-center justify-center">
              <Image
                src="/logo-icon.svg"
                alt="SuzaLink"
                width={36}
                height={36}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <Image
                src="/logo-wide.svg"
                alt="SuzaLink"
                width={130}
                height={36}
                className="object-contain"
              />
              <button
                onClick={() => setIsCollapsed(true)}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  "bg-gray-100/80 hover:bg-gray-200/80",
                  "text-gray-500 hover:text-gray-700",
                  "transition-all duration-200",
                  "hover:scale-105 active:scale-95"
                )}
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className={cn(
              "absolute -right-3 top-20 z-50",
              "h-6 w-6 rounded-full",
              "bg-white border border-gray-200 shadow-sm",
              "flex items-center justify-center",
              "text-gray-500 hover:text-gray-700",
              "transition-all duration-200",
              "hover:scale-110 hover:shadow-md"
            )}
            aria-label="Expand sidebar"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        )}

        {/* Navigation */}
        <TooltipProvider delayDuration={0}>
          <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredGroups.map((group, groupIndex) => (
              <div
                key={group.title}
                className={cn(groupIndex > 0 && "mt-6")}
              >
                {/* Group Title */}
                {!isCollapsed && (
                  <h3 className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {group.title}
                  </h3>
                )}

                {/* Separator for collapsed */}
                {isCollapsed && groupIndex > 0 && (
                  <div className="mx-3 mb-3 border-t border-gray-100" />
                )}

                {/* Items */}
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const isProspectionItem = (item as any).isProspection;
                    const isActive = isProspectionItem
                      ? pathname.includes("/campaigns/") && pathname.includes("/leads")
                      : pathname === item.href ||
                        (pathname.startsWith(item.href + "/") && !pathname.includes("/leads"));

                    if (isProspectionItem) {
                      const prospectionItem = (
                        <ProspectionItem
                          item={item}
                          isActive={isActive}
                          isCollapsed={isCollapsed}
                          assignedCampaigns={assignedCampaigns}
                          onCampaignClick={handleProspectionClick}
                          prospectionOpen={prospectionOpen}
                          setProspectionOpen={setProspectionOpen}
                        />
                      );

                      if (isCollapsed) {
                        return (
                          <Tooltip key={item.name}>
                            <TooltipTrigger asChild>
                              {prospectionItem}
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                            >
                              {item.name}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      return <div key={item.name}>{prospectionItem}</div>;
                    }

                    const navItem = (
                      <Link href={item.href}>
                        <NavItem
                          item={item}
                          isActive={isActive}
                          isCollapsed={isCollapsed}
                          index={itemIndex}
                        />
                      </Link>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.name}>
                          <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
                          >
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return <div key={item.name}>{navItem}</div>;
                  })}
                </div>
              </div>
            ))}
          </nav>
        </TooltipProvider>

        {/* Footer */}
        <div className={cn(
          "border-t border-gray-100 p-3",
          isCollapsed && "flex justify-center"
        )}>
          {!isCollapsed ? (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-primary-50 to-blue-50">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900">SuzaLink Pro</p>
                <p className="text-[10px] text-gray-500">v2.0 • Suzali Conseil</p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
