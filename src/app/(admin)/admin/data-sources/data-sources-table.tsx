"use client";

import { useState } from "react";
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
import { MoreHorizontal, Trash2 } from "lucide-react";
import { relativeDate } from "@/lib/utils";
import { updateDataSourceActive, deleteDataSource } from "@/lib/supabase/admin-actions";
import type { DataSource } from "@/types/database";

interface DataSourcesTableProps {
  dataSources: DataSource[];
}

export function DataSourcesTable({ dataSources }: DataSourcesTableProps) {
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

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
            <TableHead className="w-[70px]"></TableHead>
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
                    <Badge variant="outline" className="capitalize">
                      {ds.source_type}
                    </Badge>
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
