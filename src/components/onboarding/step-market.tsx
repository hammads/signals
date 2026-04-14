"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingStep2Schema,
  DISTRICT_TYPES,
  DISTRICT_SIZES,
  US_STATES,
  type OnboardingStep2,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface StepMarketProps {
  data: Partial<OnboardingStep2>;
  onChange: (data: OnboardingStep2) => void;
  onNext: () => void;
  onBack: () => void;
}

const DISTRICT_SIZE_LABELS: Record<(typeof DISTRICT_SIZES)[number], string> = {
  small: "Small (under 1,000 students)",
  medium: "Medium (1,000–10,000 students)",
  large: "Large (10,000+ students)",
};

export function StepMarket({ data, onChange, onNext, onBack }: StepMarketProps) {
  const form = useForm<OnboardingStep2>({
    resolver: zodResolver(onboardingStep2Schema),
    defaultValues: {
      district_types: data.district_types ?? [],
      district_size_range: data.district_size_range ?? "medium",
      target_regions: data.target_regions ?? [],
    },
  });

  const handleSubmit = (values: OnboardingStep2) => {
    onChange(values);
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                              field.onChange(
                                checked ? [] : [...DISTRICT_TYPES]
                              );
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
                              className={
                                isAll
                                  ? "font-normal capitalize text-muted-foreground"
                                  : "font-normal capitalize"
                              }
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
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
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
                              field.onChange(
                                checked ? [] : [...US_STATES]
                              );
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
                              className={
                                isAll
                                  ? "cursor-pointer font-mono text-xs font-normal text-muted-foreground"
                                  : "cursor-pointer font-mono text-xs font-normal"
                              }
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

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="submit" size="lg">
            Continue
          </Button>
        </div>
      </form>
    </Form>
  );
}
