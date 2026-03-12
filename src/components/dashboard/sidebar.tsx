"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Radio,
  FileStack,
  UserCircle,
  Settings,
  LogOut,
  Satellite,
  BookOpen,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";
import { signOut } from "@/lib/supabase/actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "./sidebar-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Signal Feed", icon: Radio },
  { href: "/digests", label: "Digests", icon: FileStack },
  { href: "/profile", label: "My Profile", icon: UserCircle },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/help", label: "Help", icon: BookOpen },
] as const;

interface DashboardSidebarProps {
  user: User;
  profile: Profile | null;
}

function SidebarContent({ user, profile }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  const displayName =
    profile?.full_name ?? profile?.company_name ?? user.email?.split("@")[0] ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Satellite className="size-5" />
        </div>
        <span className="font-bold tracking-tight text-foreground">AI Signals Radar</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || (href === "/help" && pathname?.startsWith("/help"));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("size-4.5 shrink-0", isActive ? "text-white" : "text-muted-foreground")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <Separator className="mx-4 opacity-50" />

      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 rounded-xl px-3 py-2.5 h-auto hover:bg-sidebar-accent transition-colors"
            >
              <Avatar size="sm" className="size-9 border-2 border-background shadow-sm">
                <AvatarImage src={user.user_metadata?.avatar_url} alt="" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start overflow-hidden text-left">
                <span className="truncate text-sm font-bold text-foreground">
                  {displayName}
                </span>
                <span className="truncate text-[11px] font-medium text-muted-foreground/80">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <form action={signOut}>
                <button type="submit" className="flex w-full items-center gap-2">
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function DashboardSidebar({ user, profile }: DashboardSidebarProps) {
  const { open, setOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <SidebarContent user={user} profile={profile} />
      </aside>

      {/* Mobile sidebar (Sheet) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarContent user={user} profile={profile} />
        </SheetContent>
      </Sheet>
    </>
  );
}
