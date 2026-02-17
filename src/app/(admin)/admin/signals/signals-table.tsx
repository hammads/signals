"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SIGNAL_CATEGORY_CONFIG } from "@/lib/utils";
import { deleteSignal } from "@/lib/supabase/admin-actions";
import type { Signal } from "@/types/database";
import type { SignalCategory } from "@/types/database";

interface SignalsTableProps {
  signals: Signal[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function SignalsTable({
  signals,
  currentPage,
  totalPages,
  searchQuery,
}: SignalsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function setSearch(q: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("q", q);
    next.delete("page");
    router.push(`/admin/signals?${next.toString()}`);
  }

  function setPage(p: number) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("page", String(p));
    router.push(`/admin/signals?${next.toString()}`);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this signal?")) return;
    await deleteSignal(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form
        className="flex items-center gap-2 max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
          setSearch(q);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search signals..."
            defaultValue={searchQuery}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Search
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No signals found
                </TableCell>
              </TableRow>
            ) : (
              signals.map((signal) => {
                const isExpanded = expandedId === signal.id;
                const category = signal.signal_category as SignalCategory | null;
                const catConfig = category ? SIGNAL_CATEGORY_CONFIG[category] : null;
                return (
                  <React.Fragment key={signal.id}>
                    <TableRow
                      className="cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                    >
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(isExpanded ? null : signal.id);
                          }}
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {signal.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize text-xs">
                          {signal.source_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {catConfig ? (
                          <Badge
                            variant="secondary"
                            className={cn("text-xs", catConfig.bgColor, catConfig.color)}
                          >
                            {catConfig.label}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {signal.region ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(signal.published_at ?? signal.created_at)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(signal.id)}
                            >
                              <Trash2 className="size-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30 p-4">
                          <div className="space-y-2 text-sm">
                            {signal.source_url && (
                              <p>
                                <span className="font-medium">URL:</span>{" "}
                                <a
                                  href={signal.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {signal.source_url}
                                </a>
                              </p>
                            )}
                            {signal.raw_content && (
                              <div>
                                <span className="font-medium">Content:</span>
                                <p className="mt-1 whitespace-pre-wrap max-h-64 overflow-y-auto rounded border p-3 bg-background">
                                  {signal.raw_content}
                                </p>
                              </div>
                            )}
                            {!signal.raw_content && (
                              <p className="text-muted-foreground">No content</p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
