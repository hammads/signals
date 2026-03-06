"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

interface DashboardHeaderProps {
  title: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { toggle } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-border/50 bg-background/80 px-4 backdrop-blur-lg lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
        onClick={toggle}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>
      <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
    </header>
  );
}
