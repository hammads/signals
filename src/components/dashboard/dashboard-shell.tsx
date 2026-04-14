"use client";

import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { SidebarProvider } from "./sidebar-context";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Signal Feed",
  "/scan-history": "Scan history",
  "/digests": "Digests",
  "/onboarding": "Get Started",
  "/profile": "My Profile",
  "/help": "Help",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  if (pathname?.startsWith("/help")) return "Help";
  return PAGE_TITLES[pathname] ?? "Dashboard";
}

interface DashboardShellProps {
  user: User;
  profile: Profile | null;
  children: React.ReactNode;
}

export function DashboardShell({ user, profile, children }: DashboardShellProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname ?? "");

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <DashboardSidebar user={user} profile={profile} />
        <div className="flex flex-1 flex-col lg:pl-0">
          <DashboardHeader title={pageTitle} />
          <main className="flex-1 p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
