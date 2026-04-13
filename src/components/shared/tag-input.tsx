"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Add tags...",
  maxTags,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("");

  const addTag = React.useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      const isDuplicate = value.some(
        (v) => v.toLowerCase() === trimmed.toLowerCase()
      );
      if (isDuplicate) return;
      if (maxTags != null && value.length >= maxTags) return;
      onChange([...value, trimmed]);
      setInputValue("");
    },
    [value, onChange, maxTags]
  );

  const removeTag = React.useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
  };

  const canAddMore = maxTags == null || value.length < maxTags;

  return (
    <div
      className={cn(
        "flex min-h-9 flex-wrap items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      {value.map((tag, index) => (
        <Badge
          key={`${tag}-${index}`}
          variant="secondary"
          className="gap-1 pr-1 font-normal"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="rounded-full p-0.5 hover:bg-muted-foreground/20"
            aria-label={`Remove ${tag}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      {canAddMore && (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-24 flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      )}
    </div>
  );
}
