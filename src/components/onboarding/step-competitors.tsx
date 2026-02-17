"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { onboardingStep4Schema, type OnboardingStep4 } from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/shared/tag-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface StepCompetitorsProps {
  data: Partial<OnboardingStep4>;
  onChange: (data: OnboardingStep4) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepCompetitors({
  data,
  onChange,
  onNext,
  onBack,
}: StepCompetitorsProps) {
  const form = useForm<OnboardingStep4>({
    resolver: zodResolver(onboardingStep4Schema),
    defaultValues: {
      competitor_names: data.competitor_names ?? [],
      bellwether_districts: data.bellwether_districts ?? [],
    },
  });

  const handleSubmit = (values: OnboardingStep4) => {
    onChange(values);
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
