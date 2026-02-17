"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { format } from "date-fns";
import { FileStack, ChevronDown, ChevronUp } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Digest } from "@/types/database";

export interface DigestsListProps {
  digests: Digest[];
}

export function DigestsList({ digests }: DigestsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (digests.length === 0) {
    return (
      <EmptyState
        icon={FileStack}
        title="No digests yet"
        description="Your weekly or bi-weekly digest summaries will appear here once they're generated."
      />
    );
  }

  return (
    <div className="space-y-4">
      {digests.map((digest) => {
        const isExpanded = expandedId === digest.id;
        return (
          <Card key={digest.id} className="overflow-hidden">
            <CardHeader className="cursor-pointer py-4" onClick={() => setExpandedId(isExpanded ? null : digest.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {format(new Date(digest.period_start), "MMM d, yyyy")} –{" "}
                    {format(new Date(digest.period_end), "MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {digest.signal_match_ids.length} signal
                    {digest.signal_match_ids.length !== 1 ? "s" : ""} in this
                    digest
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm">
                  {isExpanded ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            {isExpanded && digest.summary_markdown && (
              <CardContent className="border-t pt-4">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {digest.summary_markdown}
                  </ReactMarkdown>
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
