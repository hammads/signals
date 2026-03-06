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
    <aside className="flex w-64 shrink-0 flex-col bg-primary/95 text-primary-foreground backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white backdrop-blur">
          <Shield className="size-5" />
        </div>
        <span className="font-bold tracking-tight text-white">
          Admin Panel
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] font-bold uppercase tracking-wider text-white/80 border-white/20">
          Admin
        </Badge>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-white text-primary shadow-lg shadow-black/10 scale-[1.02]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-4.5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 h-auto text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Avatar size="sm" className="size-9 border-2 border-white/10">
                <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                <AvatarFallback className="bg-white/20 text-xs font-bold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                <span className="truncate text-sm font-bold text-white">{displayName}</span>
                <span className="truncate text-[11px] font-medium text-white/60">
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
