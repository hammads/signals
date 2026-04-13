"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingStep3Schema,
  FUNDING_SOURCES,
  FUNDING_SOURCE_DESCRIPTIONS,
  type OnboardingStep3,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { TagInput } from "@/components/shared/tag-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StepFundingProps {
  data: Partial<OnboardingStep3>;
  onChange: (data: OnboardingStep3) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepFunding({ data, onChange, onNext, onBack }: StepFundingProps) {
  const form = useForm<OnboardingStep3>({
    resolver: zodResolver(onboardingStep3Schema),
    defaultValues: {
      funding_sources: data.funding_sources ?? [],
      keywords: data.keywords ?? [],
    },
  });

  const handleSubmit = (values: OnboardingStep3) => {
    onChange(values);
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
                                  : (field.value ?? []).filter((s) => s !== source);
                                field.onChange(next);
                              }}
                            />
                          </FormControl>
                          <div className="grid gap-0.5 leading-snug">
                            <FormLabel className="font-normal">{source}</FormLabel>
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
