"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  signalProfileSchema,
  SOLUTION_CATEGORIES,
  DISTRICT_TYPES,
  DISTRICT_SIZES,
  US_STATES,
  FUNDING_SOURCES,
  FUNDING_SOURCE_DESCRIPTIONS,
  type SignalProfileInput,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/shared/tag-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { SignalProfile } from "@/types/database";

const DISTRICT_SIZE_LABELS: Record<(typeof DISTRICT_SIZES)[number], string> = {
  small: "Small (under 1,000 students)",
  medium: "Medium (1,000–10,000 students)",
  large: "Large (10,000+ students)",
};

export interface ProfileFormProps {
  profile: SignalProfile | null;
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const router = useRouter();

  const form = useForm<SignalProfileInput>({
    resolver: zodResolver(signalProfileSchema),
    defaultValues: {
      keywords: profile?.keywords ?? [],
      target_regions: profile?.target_regions ?? [],
      district_types: profile?.district_types ?? [],
      district_size_range: profile?.district_size_range ?? "medium",
      problem_areas: profile?.problem_areas ?? [],
      solution_categories: profile?.solution_categories ?? [],
      funding_sources: profile?.funding_sources ?? [],
      competitor_names: profile?.competitor_names ?? [],
      bellwether_districts: profile?.bellwether_districts ?? [],
    },
  });

  const onSubmit = async (values: SignalProfileInput) => {
    try {
      const res = await fetch("/api/profiles/signal-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save profile");
      }

      toast.success("Profile saved successfully");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Company & Solutions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="solution_categories"
              render={() => (
                <FormItem>
                  <FormLabel>Primary categories</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SOLUTION_CATEGORIES.map((category) => (
                        <FormField
                          key={category}
                          control={form.control}
                          name="solution_categories"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(category)}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...(field.value ?? []), category]
                                      : (field.value ?? []).filter(
                                          (c) => c !== category
                                        );
                                    field.onChange(next);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {category}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="problem_areas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Solution categories</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="e.g. teacher burnout, student engagement..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Market</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="district_types"
              render={() => (
                <FormItem>
                  <FormLabel>District types</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-4">
                      <FormField
                        control={form.control}
                        name="district_types"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={(field.value?.length ?? 0) === 0}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? [] : []);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal font-medium">
                              All
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {DISTRICT_TYPES.map((type) => (
                        <FormField
                          key={type}
                          control={form.control}
                          name="district_types"
                          render={({ field }) => {
                            const isAll = (field.value?.length ?? 0) === 0;
                            return (
                              <FormItem className="flex flex-row items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={
                                      isAll || field.value?.includes(type)
                                    }
                                    disabled={isAll}
                                    onCheckedChange={(checked) => {
                                      if (isAll) return;
                                      const next = checked
                                        ? [...(field.value ?? []), type]
                                        : (field.value ?? []).filter(
                                            (t) => t !== type
                                          );
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel
                                  className={cn(
                                    "font-normal capitalize",
                                    isAll && "text-muted-foreground"
                                  )}
                                >
                                  {type}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="district_size_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>District size</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === "" ? null : v)}
                    value={field.value ?? "medium"}
                  >
                    <FormControl>
                      <SelectTrigger className="max-w-md">
                        <SelectValue placeholder="Select district size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DISTRICT_SIZES.map((size) => (
                        <SelectItem key={size} value={size}>
                          {DISTRICT_SIZE_LABELS[size]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_regions"
              render={() => (
                <FormItem>
                  <FormLabel>Target regions (states)</FormLabel>
                  <FormControl>
                    <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto rounded-md border border-input p-4 sm:grid-cols-5 md:grid-cols-6">
                      <FormField
                        control={form.control}
                        name="target_regions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center gap-2">
                            <FormControl>
                              <Checkbox
                                checked={(field.value?.length ?? 0) === 0}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked ? [] : []);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-mono text-xs font-normal font-medium">
                              All
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {US_STATES.map((state) => (
                        <FormField
                          key={state}
                          control={form.control}
                          name="target_regions"
                          render={({ field }) => {
                            const isAll = (field.value?.length ?? 0) === 0;
                            return (
                              <FormItem className="flex flex-row items-center gap-2">
                                <FormControl>
                                  <Checkbox
                                    checked={
                                      isAll || field.value?.includes(state)
                                    }
                                    disabled={isAll}
                                    onCheckedChange={(checked) => {
                                      if (isAll) return;
                                      const next = checked
                                        ? [...(field.value ?? []), state]
                                        : (field.value ?? []).filter(
                                            (s) => s !== state
                                          );
                                      field.onChange(next);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel
                                  className={cn(
                                    "cursor-pointer font-mono text-xs font-normal",
                                    isAll && "text-muted-foreground"
                                  )}
                                >
                                  {state}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funding & Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="funding_sources"
              render={() => (
                <FormItem>
                  <FormLabel>Funding sources</FormLabel>
                  <FormControl>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FUNDING_SOURCES.map((source) => (
                        <FormField
                          key={source}
                          control={form.control}
                          name="funding_sources"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start gap-2 space-y-0">
                              <FormControl className="mt-1">
                                <Checkbox
                                  checked={field.value?.includes(source)}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...(field.value ?? []), source]
                                      : (field.value ?? []).filter(
                                          (s) => s !== source
                                        );
                                    field.onChange(next);
                                  }}
                                />
                              </FormControl>
                              <div className="grid gap-0.5 leading-snug">
                                <FormLabel className="font-normal">
                                  {source}
                                </FormLabel>
                                <p className="text-muted-foreground text-xs">
                                  {FUNDING_SOURCE_DESCRIPTIONS[source]}
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keywords</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="e.g. literacy, STEM, SEL..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Competitive Landscape</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="competitor_names"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competitor names</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="e.g. Clever, ClassDojo..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bellwether_districts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bellwether districts</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="e.g. Chicago Public Schools, NYC DOE..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Button type="submit" size="lg">
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
