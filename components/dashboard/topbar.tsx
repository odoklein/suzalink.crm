"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import { GlobalSearchDialog } from "@/components/search/global-search-dialog";
import { LogOut, Settings, Search } from "lucide-react";
import Link from "next/link";

// Brand Colors
const LIME_GREEN = "#C4E538";
const INK_GREEN = "#024037";

export function TopBar() {
  const { data: session } = useSession();
  const [searchOpen, setSearchOpen] = useState(false);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: "Administrateur",
      MANAGER: "Gestionnaire",
      BD: "Business Developer",
      DEVELOPER: "Développeur",
    };
    return roleMap[role] || role;
  };

  const userRole = session?.user?.role || "BD";

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm"
      style={{ backgroundColor: "white" }}
    >
      <div className="flex h-16 items-center justify-between px-6">
        {/* Search Button */}
        <Button
          variant="outline"
          className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground sm:w-64 lg:w-80"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="hidden lg:inline-flex">Rechercher dans le CRM...</span>
          <span className="inline-flex lg:hidden">Rechercher...</span>
          <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Right Section: Notifications, User Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" suppressHydrationWarning>
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarImage src={session?.user?.avatar || undefined} />
                  <AvatarFallback 
                    className="font-semibold text-sm"
                    style={{ 
                      backgroundColor: `rgba(196, 229, 56, 0.2)`,
                      color: INK_GREEN
                    }}
                  >
                    {session?.user?.email ? getInitials(session.user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p 
                    className="text-sm font-semibold"
                    style={{ color: INK_GREEN }}
                  >
                    {session?.user?.email?.split("@")[0] || "User"}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ color: `rgba(2, 64, 55, 0.6)` }}
                  >
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  Paramètres
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-[#EF4444] focus:text-[#EF4444] cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

