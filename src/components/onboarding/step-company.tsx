"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingStep1Schema,
  SOLUTION_CATEGORIES,
  type OnboardingStep1,
} from "@/types/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface StepCompanyProps {
  data: Partial<OnboardingStep1>;
  onChange: (data: OnboardingStep1) => void;
  onNext: () => void;
}

export function StepCompany({ data, onChange, onNext }: StepCompanyProps) {
  const form = useForm<OnboardingStep1>({
    resolver: zodResolver(onboardingStep1Schema),
    defaultValues: {
      company_name: data.company_name ?? "",
      solution_categories: data.solution_categories ?? [],
      problem_areas: data.problem_areas ?? [],
    },
  });

  const handleSubmit = (values: OnboardingStep1) => {
    onChange(values);
    onNext();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Acme EdTech Inc."
                  {...field}
                  className="max-w-md"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="solution_categories"
          render={() => (
            <FormItem>
              <FormLabel>Solution categories</FormLabel>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SOLUTION_CATEGORIES.map((category) => (
                    <FormField
                      key={category}
                      control={form.control}
                      name="solution_categories"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(category)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...(field.value ?? []), category]
                                  : (field.value ?? []).filter((c) => c !== category);
                                field.onChange(next);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">{category}</FormLabel>
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
              <FormLabel>Problem areas</FormLabel>
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

        <Button type="submit" size="lg">
          Continue
        </Button>
      </form>
    </Form>
  );
}
