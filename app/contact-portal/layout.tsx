"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CalendarCheck,
  LogOut,
  Building2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ContactSession {
  authenticated: boolean;
  contact?: {
    id: string;
    name: string;
    email: string;
    accountId: string;
    account: {
      id: string;
      companyName: string;
      logoUrl: string | null;
    };
  };
}

const NAV_ITEMS = [
  {
    href: "/contact-portal/dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
  },
  {
    href: "/contact-portal/bookings",
    label: "Rendez-vous",
    icon: CalendarCheck,
  },
  {
    href: "/contact-portal/calendar",
    label: "Calendrier",
    icon: Calendar,
  },
];

export default function ContactPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  // Check if we're on the token verification page
  const isTokenPage = pathname.match(/^\/contact-portal\/[a-f0-9]{64}$/i);

  // Fetch session
  const { data: session, isLoading } = useQuery<ContactSession>({
    queryKey: ["contact-portal-session"],
    queryFn: async () => {
      const res = await fetch("/api/contact-portal/verify");
      if (!res.ok) throw new Error("Failed to check session");
      return res.json();
    },
    enabled: !isTokenPage,
    retry: false,
  });

  const handleLogout = async () => {
    await fetch("/api/contact-portal/verify", { method: "DELETE" });
    router.push("/contact-portal");
    router.refresh();
  };

  // Show loading on protected pages
  if (!isTokenPage && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-500" />
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (except on token page)
  if (!isTokenPage && !session?.authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <Building2 className="h-10 w-10 text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Accès au portail
          </h1>
          <p className="text-slate-500 mb-6">
            Veuillez utiliser le lien d'accès qui vous a été envoyé par email pour accéder à votre portail.
          </p>
        </div>
      </div>
    );
  }

  // Token verification page - render without layout
  if (isTokenPage) {
    return <>{children}</>;
  }

  const contact = session?.contact;
  const account = contact?.account;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-primary-50/20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo / Company Name */}
            <div className="flex items-center gap-3">
              {account?.logoUrl ? (
                <img
                  src={account.logoUrl}
                  alt={account.companyName}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-900">{account?.companyName}</p>
                <p className="text-xs text-slate-500">Portail Client</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{contact?.name}</p>
                <p className="text-xs text-slate-500">{contact?.email}</p>
              </div>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary-100 text-primary-700 text-sm font-medium">
                  {contact?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 text-slate-500 hover:text-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className="md:hidden sticky top-16 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="flex overflow-x-auto px-4 py-2 gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}









