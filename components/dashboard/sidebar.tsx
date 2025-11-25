"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "./sidebar-context";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";

// Brand Colors
const LIME_GREEN = "#C4E538";
const INK_GREEN = "#024037";
const SOFT_OFF_WHITE = "#ffffff";
const PRIMARY_BLUE = "#4C85FF";
const TEXT_LIGHT_GRAY = "#63696e";

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
      { name: "Prospection", href: "/leads/workspace", icon: GitBranch, roles: ["ADMIN", "MANAGER", "BD"] },
      { name: "Campagnes", href: "/campaigns", icon: Megaphone, roles: ["ADMIN", "MANAGER", "BD"] },
    ],
  },
  {
    title: "Communication",
    items: [
      { name: "Messages", href: "/communication", icon: MessageSquare, roles: ["ADMIN", "MANAGER", "BD", "DEVELOPER"] },
      { name: "Automatisations", href: "/email-automation", icon: Workflow, roles: ["ADMIN", "MANAGER"] },
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

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const userRole = session?.user?.role || "BD";
  
  // Filter navigation groups and their items based on user role
  const filteredGroups = navigationGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(userRole)),
  })).filter((group) => group.items.length > 0); // Only show groups that have visible items

  // Sidebar widths based on image specifications: 260px expanded, 76px collapsed
  const sidebarWidth = isCollapsed ? "w-[76px]" : "w-[260px]";

  return (
    <>
      <div className={cn(
        "fixed left-0 top-0 h-screen border-r border-gray-200 transition-all duration-300 z-30",
        sidebarWidth
      )} style={{ backgroundColor: SOFT_OFF_WHITE }}>
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className={cn(
            "flex items-center border-b border-gray-200",
            isCollapsed ? "justify-center relative" : ""
          )}
          style={{
            paddingTop: "16px",
            paddingBottom: "16px",
            paddingLeft: isCollapsed ? "0" : "20px",
            paddingRight: isCollapsed ? "0" : "20px",
          }}>
            {isCollapsed ? (
              <>
                <div className="flex items-center justify-center">
                  <Image
                    src="/logo-icon.svg"
                    alt="Suzali Conseil"
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    "absolute right-2 h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                    "hover:bg-gray-100"
                  )}
                  style={{ 
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280"
                  }}
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <div className="flex items-center flex-shrink-0">
                  <Image
                    src="/logo-wide.svg"
                    alt="Suzali Conseil"
                    width={140}
                    height={60}
                    className="object-contain h-10"
                  />
                </div>
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={cn(
                    "ml-auto h-8 w-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0",
                    "hover:bg-gray-100"
                  )}
                  style={{ 
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280"
                  }}
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <TooltipProvider delayDuration={300}>
            <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
              <div style={{ paddingTop: "16px", paddingLeft: "12px", paddingRight: "12px" }}>
                {filteredGroups.map((group, groupIndex) => (
                  <div key={group.title} style={groupIndex > 0 ? { marginTop: "12px" } : {}}>
                    {!isCollapsed && (
                      <h3 
                        className="text-xs font-medium uppercase tracking-[0.05em]"
                        style={{ 
                          color: TEXT_LIGHT_GRAY,
                          paddingLeft: "4px",
                          paddingBottom: "16px"
                        }}
                      >
                        {group.title}
                      </h3>
                    )}
                    <div>
                      {group.items.map((item, itemIndex) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                        
                        const navItemContent = (
                          <>
                            <item.icon
                              className="flex-shrink-0 transition-all"
                              style={{
                                width: "20px",
                                height: "20px",
                                color: isActive 
                                  ? "#FFFFFF" // White icon on blue background
                                  : "#63696e", // Darker gray for better contrast
                              }}
                            />
                            {!isCollapsed && (
                              <span 
                                className="truncate transition-all"
                                style={{
                                  color: isActive ? "#FFFFFF" : "#9aa1a7", // White text on blue, darker gray for non-active
                                  fontWeight: isActive ? 600 : 500,
                                  fontSize: "14px",
                                  lineHeight: "20px",
                                  marginLeft: "12px" // 12px spacing between icon and text
                                }}
                              >
                                {item.name}
                              </span>
                            )}
                          </>
                        );

                        const navItemClasses = cn(
                          "flex items-center rounded-lg transition-all w-full relative",
                          isCollapsed && "justify-center"
                        );

                        const navItemStyle = {
                          ...(isActive
                            ? {
                                backgroundColor: PRIMARY_BLUE, // Solid blue background for active
                                boxShadow: "0 2px 4px rgba(76, 133, 255, 0.25)",
                              }
                            : {
                                backgroundColor: "transparent",
                              }),
                          height: isCollapsed ? "44px" : (isActive ? "44px" : "40px"),
                          paddingLeft: "12px",
                          paddingRight: "12px",
                          marginBottom: itemIndex < group.items.length - 1 ? "4px" : "0", // 4px vertical spacing between items
                        };

                        const navItem = (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={navItemClasses}
                            style={navItemStyle}
                          >
                            {navItemContent}
                          </Link>
                        );

                        if (isCollapsed) {
                          return (
                            <Tooltip key={item.name}>
                              <TooltipTrigger asChild>
                                {navItem}
                              </TooltipTrigger>
                              <TooltipContent side="right" className="bg-gray-900 text-white text-xs">
                                {item.name}
                              </TooltipContent>
                            </Tooltip>
                          );
                        }

                        return navItem;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </nav>
          </TooltipProvider>
        </div>
      </div>
    </>
  );
}
