"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { SidebarProvider, useSidebar } from "@/components/dashboard/sidebar-context";
import { AssistantProvider } from "@/components/assistant";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  const sidebarMargin = isCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className={`${sidebarMargin} flex-1 flex flex-col transition-all duration-300`}>
        <TopBar />
        <main className="flex-1 bg-[#F8FAF9] overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AssistantProvider>
        <DashboardContent>{children}</DashboardContent>
      </AssistantProvider>
    </SidebarProvider>
  );
}
