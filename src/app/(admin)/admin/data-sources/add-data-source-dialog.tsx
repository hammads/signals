"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Sparkles } from "lucide-react";
import { createDataSource } from "@/lib/supabase/admin-actions";
import type { DataSourceType } from "@/types/database";
import type { DataSourceSuggestion } from "@/app/api/admin/data-sources/suggest/route";

const SOURCE_TYPES: DataSourceType[] = ["rss", "api", "scrape", "ai_search"];

type DialogMode = "manual" | "discover";

export function AddDataSourceDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("manual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<DataSourceType>("rss");
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [prefillName, setPrefillName] = useState("");

  // Discover state
  const [discoverQuery, setDiscoverQuery] = useState("");
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<DataSourceSuggestion[]>([]);

  async function handleDiscover() {
    if (!discoverQuery.trim() || discoverQuery.length < 3) return;
    setDiscoverLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch("/api/admin/data-sources/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: discoverQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch suggestions");
      setSuggestions(data.suggestions ?? []);
      if (!data.suggestions?.length) {
        setError("No suggestions found. Try a different search.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch suggestions");
    } finally {
      setDiscoverLoading(false);
    }
  }

  function applySuggestion(s: DataSourceSuggestion) {
    setSourceType(s.source_type);
    setConfig(s.config);
    setPrefillName(s.name);
    setMode("manual");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData();
    formData.set("name", (form.elements.namedItem("name") as HTMLInputElement).value);
    formData.set("source_type", sourceType);
    formData.set("scan_frequency_hours", (form.elements.namedItem("scan_frequency_hours") as HTMLInputElement).value || "24");
    formData.set("config", JSON.stringify(config));
    formData.set("is_active", "true");
    const result = await createDataSource(formData);
    setLoading(false);
    if (result?.error) {
      setError(typeof result.error === "string" ? result.error : "Invalid input");
      return;
    }
    setOpen(false);
    form.reset();
    setSourceType("rss");
    setConfig({});
    setSuggestions([]);
    setDiscoverQuery("");
    setPrefillName("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setMode("manual");
      setSuggestions([]);
      setDiscoverQuery("");
      setError(null);
      setConfig({});
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Data Source
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Data Source</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button
            type="button"
            variant={mode === "manual" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("manual")}
          >
            Add manually
          </Button>
          <Button
            type="button"
            variant={mode === "discover" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("discover")}
          >
            <Sparkles className="size-4 mr-1" />
            Discover with AI
          </Button>
        </div>

        {mode === "discover" ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. K-12 education RSS feeds, EdTech news"
                value={discoverQuery}
                onChange={(e) => setDiscoverQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleDiscover())}
              />
              <Button
                type="button"
                onClick={handleDiscover}
                disabled={discoverLoading || discoverQuery.trim().length < 3}
              >
                {discoverLoading ? (
                  "Searching…"
                ) : (
                  <>
                    <Search className="size-4 mr-1" />
                    Search
                  </>
                )}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {suggestions.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-sm text-muted-foreground">Select a source to add:</p>
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border p-3 text-left hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{s.source_type}</p>
                      {s.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      )}
                      {"url" in s.config && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {(s.config as { url?: string }).url}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => applySuggestion(s)}
                    >
                      Use this
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && mode === "manual" && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. EdWeek RSS"
              value={prefillName}
              onChange={(e) => setPrefillName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source_type">Type</Label>
            <Select value={sourceType} onValueChange={(v) => setSourceType(v as DataSourceType)}>
              <SelectTrigger id="source_type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {sourceType === "rss" && (
            <div className="space-y-2">
              <Label>RSS URL</Label>
              <Input
                value={(config as { url?: string })?.url ?? ""}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://example.com/feed"
              />
            </div>
          )}
          {sourceType === "ai_search" && (
            <div className="space-y-2">
              <Label>Query template</Label>
              <Input
                value={(config as { query_template?: string })?.query_template ?? ""}
                onChange={(e) => setConfig({ ...config, query_template: e.target.value })}
                placeholder="K-12 education grants 2026"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="scan_frequency_hours">Scan frequency (hours)</Label>
            <Input
              id="scan_frequency_hours"
              name="scan_frequency_hours"
              type="number"
              min={1}
              defaultValue={24}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding…" : "Add"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
