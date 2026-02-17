"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  Radio,
  Users,
  Activity,
  Shield,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/data-sources", label: "Data Sources", icon: Database },
  { href: "/admin/signals", label: "Signals", icon: Radio },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/pipeline-runs", label: "Pipeline Runs", icon: Activity },
] as const;

interface AdminSidebarProps {
  user: User;
  profile: Profile | null;
}

export function AdminSidebar({ user, profile }: AdminSidebarProps) {
  const pathname = usePathname();

  const displayName =
    profile?.full_name ??
    profile?.company_name ??
    user.email?.split("@")[0] ??
    "Admin";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-slate-900">
      <div className="flex h-14 items-center gap-2 border-b border-slate-700/50 px-4">
        <Shield className="size-5 text-slate-300" />
        <span className="font-semibold tracking-tight text-slate-100">
          Admin Panel
        </span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Admin
        </Badge>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-slate-700/80 text-white"
                  : "text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 h-auto text-slate-300 hover:bg-slate-700/50 hover:text-slate-100"
            >
              <Avatar size="sm" className="size-8">
                <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="truncate text-xs text-slate-400">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
