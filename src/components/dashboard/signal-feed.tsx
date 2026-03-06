"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { SignalCard } from "@/components/shared/signal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Radio, ChevronLeft, ChevronRight } from "lucide-react";
import type { SignalMatchWithSignal, SignalCategory } from "@/types/database";
import { cn } from "@/lib/utils";
import { US_STATES } from "@/types/schemas";

const CATEGORY_PILLS: { value: "" | SignalCategory; label: string }[] = [
  { value: "", label: "All" },
  { value: "grant", label: "Grant" },
  { value: "rfp", label: "RFP" },
  { value: "board_minutes", label: "Board Activity" },
  { value: "news", label: "News" },
  { value: "competitor", label: "Competitor" },
  { value: "policy", label: "Policy" },
];

export interface SignalFeedProps {
  initialMatches: SignalMatchWithSignal[];
  totalCount: number;
  page: number;
  pageSize: number;
  initialCategory?: SignalCategory;
  initialRegion?: string;
}

export function SignalFeed({
  initialMatches,
  totalCount,
  page,
  pageSize,
  initialCategory,
  initialRegion,
}: SignalFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.delete("page");
      startTransition(() => {
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      startTransition(() => {
        router.push(`/dashboard?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleBookmarkToggle = useCallback(
    async (matchId: string, currentBookmarked: boolean) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("signal_matches")
        .update({ is_bookmarked: !currentBookmarked } as { is_bookmarked: boolean })
        .eq("id", matchId);

      if (error) {
        toast.error("Failed to update bookmark");
        return;
      }
      router.refresh();
    },
    [router]
  );

  const handleMarkRead = useCallback(
    async (matchId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("signal_matches")
        .update({ is_read: true } as { is_read: boolean })
        .eq("id", matchId);

      if (error) {
        toast.error("Failed to mark as read");
        return;
      }
      router.refresh();
    },
    [router]
  );

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const validMatches = initialMatches.filter(
    (match): match is typeof match & { signal: NonNullable<typeof match.signal> } =>
      match.signal != null
  );
  const isEmpty = validMatches.length === 0;

  // Defer Select to client-only to avoid Radix useId hydration mismatch (aria-controls)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORY_PILLS.map(({ value, label }) => (
            <Badge
              key={value || "all"}
              variant={(initialCategory ?? "") === value ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                !value && "font-medium"
              )}
              onClick={() =>
                updateParams({
                  category: value || undefined,
                  region: initialRegion,
                })
              }
            >
              {label}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {mounted ? (
            <Select
              value={initialRegion ?? "all"}
              onValueChange={(v) =>
                updateParams({
                  category: initialCategory,
                  region: v === "all" ? undefined : v,
                })
              }
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All regions</SelectItem>
                {US_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 w-[140px] animate-pulse rounded-md border border-input bg-muted/30" />
          )}
        </div>
      </div>

      {/* Feed */}
      <div className={cn("transition-opacity", isPending && "opacity-60")}>
        {isEmpty ? (
          <EmptyState
            icon={Radio}
            title={
              initialCategory || initialRegion
                ? "No signals match your filters"
                : "No signals yet"
            }
            description={
              initialCategory || initialRegion
                ? "Try selecting a different category or region, or clear your filters to see all signals."
                : "Your personalized signal feed will appear here once we find matches for your profile."
            }
            action={
              initialCategory || initialRegion
                ? {
                    label: "Clear filters",
                    onClick: () =>
                      updateParams({ category: undefined, region: undefined }),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {validMatches.map((match) => (
                <SignalCard
                  key={match.id}
                  signal={match.signal}
                  relevance_score={match.relevance_score}
                  why_it_matters={match.why_it_matters}
                  action_suggestion={match.action_suggestion}
                  is_read={match.is_read}
                  is_bookmarked={match.is_bookmarked}
                  onBookmarkToggle={() =>
                    handleBookmarkToggle(match.id, match.is_bookmarked)
                  }
                  onMarkRead={() => handleMarkRead(match.id)}
                />
              ))}
          </div>
        )}

        {/* Pagination */}
        {totalCount > pageSize && (
          <div className="mt-8 flex items-center justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, totalCount)} of {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={!hasPrev || isPending}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={!hasNext || isPending}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
