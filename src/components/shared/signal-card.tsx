"use client";

import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Lightbulb,
  Loader2,
  MapPin,
  Target,
} from "lucide-react";
import type { Signal, SignalCategory, SignalDistrictExpanded } from "@/types/database";
import { cn, relativeDate, SIGNAL_CATEGORY_CONFIG } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  grant: "Grant",
  rfp: "RFP",
  board_minutes: "Board Activity",
  news: "News",
  competitor: "Competitor",
  policy: "Policy",
  district_lookalike: "Look-alike District",
  icp_finder: "ICP Contact",
};

export interface SignalCardProps {
  signal: Pick<
    Signal,
    "title" | "source_url" | "signal_category" | "region" | "published_at" | "created_at"
  >;
  districts?: Pick<SignalDistrictExpanded, "lea_id" | "district_name" | "district_state" | "district_label">[];
  relevance_score: number | null;
  why_it_matters: string | null;
  action_suggestion: string | null;
  is_read: boolean;
  is_bookmarked: boolean;
  onBookmarkToggle: () => void;
  onMarkRead: () => void;
  /** Vector match without LLM blurbs yet; parent may auto-fetch insight. */
  insightPending?: boolean;
  insightLoading?: boolean;
}

export function SignalCard({
  signal,
  districts,
  relevance_score,
  why_it_matters,
  action_suggestion,
  is_read,
  is_bookmarked,
  onBookmarkToggle,
  onMarkRead,
  insightPending = false,
  insightLoading = false,
}: SignalCardProps) {
  const category = signal.signal_category;
  const displayDate = signal.published_at ?? signal.created_at;
  const categoryConfig = category
    ? SIGNAL_CATEGORY_CONFIG[category]
    : { label: "Other", color: "text-muted-foreground", bgColor: "bg-muted/50 border-muted" };

  const showInsightLoading =
    insightPending &&
    !why_it_matters?.trim() &&
    !action_suggestion?.trim();

  return (
    <article
      className={cn(
        "group relative rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        !is_read && "border-l-4 border-l-primary"
      )}
    >
      <div className="flex flex-col gap-4">
        {/* Header: badges, title, metadata */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {category && (
              <Badge
                variant="outline"
                className={cn(
                  "font-medium",
                  categoryConfig.bgColor,
                  categoryConfig.color
                )}
              >
                {CATEGORY_LABELS[category]}
              </Badge>
            )}
            {signal.region && (
              <Badge variant="secondary" className="font-normal">
                {signal.region}
              </Badge>
            )}
            {relevance_score != null && (
              <Badge variant="outline" className="text-muted-foreground">
                {Math.round(relevance_score * 100)}% match
              </Badge>
            )}
          </div>

          {districts && districts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <MapPin className="size-3 shrink-0 text-muted-foreground" />
              {districts.map((d) => (
                <Badge
                  key={d.lea_id}
                  variant="outline"
                  className="border-slate-200 bg-slate-50 font-normal text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {d.district_label}
                </Badge>
              ))}
            </div>
          )}

          <h3 className="text-base font-semibold leading-tight">
            <a
              href={signal.source_url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMarkRead}
              className="text-foreground hover:text-primary hover:underline"
            >
              {signal.title}
            </a>
          </h3>

          {displayDate && (
            <p
              className="text-xs text-muted-foreground"
              suppressHydrationWarning
            >
              {relativeDate(displayDate)}
            </p>
          )}
        </div>

        {showInsightLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            <Loader2
              className={cn(
                "size-4 shrink-0 text-muted-foreground",
                insightLoading ? "animate-spin" : "animate-pulse opacity-80"
              )}
            />
            <span>
              {insightLoading
                ? "Generating personalized insight…"
                : "Preparing personalized insight…"}
            </span>
          </div>
        )}

        {/* Why This Matters */}
        {why_it_matters && (
          <div className="space-y-1.5">
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Target className="size-3.5" />
              Why This Matters
            </h4>
            <p className="text-sm leading-relaxed">{why_it_matters}</p>
          </div>
        )}

        {/* Action Suggestion */}
        {action_suggestion && (
          <div className="rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
              <Lightbulb className="size-3.5" />
              Suggested Action
            </h4>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/90">
              {action_suggestion}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onBookmarkToggle}
                  className={cn(
                    is_bookmarked && "text-primary"
                  )}
                >
                  {is_bookmarked ? (
                    <BookmarkCheck className="size-4" />
                  ) : (
                    <Bookmark className="size-4" />
                  )}
                  <span className="sr-only">
                    {is_bookmarked ? "Remove bookmark" : "Bookmark"}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {is_bookmarked ? "Remove bookmark" : "Bookmark"}
              </TooltipContent>
            </Tooltip>
            {!is_read && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={onMarkRead}
              >
                Mark as read
              </Button>
            )}
          </div>
          {signal.source_url && (
            <a
              href={signal.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onMarkRead}
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <ExternalLink className="size-3.5" />
                View Source
              </Button>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
