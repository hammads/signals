"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal, Trash2, ScanSearch, Loader2 } from "lucide-react";
import { relativeDate } from "@/lib/utils";
import { updateDataSourceActive, deleteDataSource } from "@/lib/supabase/admin-actions";
import { toast } from "sonner";
import type { DataSource } from "@/types/database";

const SCANNABLE_TYPES = ["rss", "ai_search", "scrape"] as const;
const UNSUPPORTED_TYPES = ["api"] as const;

interface DataSourcesTableProps {
  dataSources: DataSource[];
}

export function DataSourcesTable({ dataSources }: DataSourcesTableProps) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [scanning, setScanning] = useState<Record<string, boolean>>({});
  const router = useRouter();

  async function handleScan(id: string) {
    setScanning((p) => ({ ...p, [id]: true }));
    try {
      const res = await fetch(`/api/admin/data-sources/${id}/scan`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to trigger scan");
      }

      toast.success("Scan triggered. Check Pipeline Runs for status.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to trigger scan");
    } finally {
      setScanning((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setOptimistic((p) => ({ ...p, [id]: !current }));
    const result = await updateDataSourceActive(id, !current);
    setOptimistic((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
    if (result?.error) {
      setOptimistic((p) => ({ ...p, [id]: current }));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this data source?")) return;
    await deleteDataSource(id);
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Scanned</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dataSources.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                No data sources yet. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            dataSources.map((ds) => {
              const isActive = optimistic[ds.id] ?? ds.is_active;
              return (
                <TableRow key={ds.id}>
                  <TableCell className="font-medium">{ds.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="capitalize">
                        {ds.source_type.replace("_", " ")}
                      </Badge>
                      {UNSUPPORTED_TYPES.includes(ds.source_type as (typeof UNSUPPORTED_TYPES)[number]) && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          Coming soon
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={isActive}
                      onCheckedChange={() => handleToggle(ds.id, ds.is_active)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {ds.last_scanned_at
                      ? relativeDate(ds.last_scanned_at)
                      : "Never"}
                  </TableCell>
                  <TableCell>Every {ds.scan_frequency_hours}h</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {SCANNABLE_TYPES.includes(ds.source_type as (typeof SCANNABLE_TYPES)[number]) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleScan(ds.id)}
                                disabled={scanning[ds.id]}
                              >
                                {scanning[ds.id] ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <ScanSearch className="size-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Scan now</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(ds.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
