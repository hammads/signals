"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from "@/types/schemas";

interface OnboardingFormData
  extends OnboardingStep1,
    OnboardingStep2,
    OnboardingStep3,
    OnboardingStep4 {}

interface StepReviewProps {
  data: OnboardingFormData;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function StepReview({
  data,
  onSubmit,
  onBack,
  isSubmitting = false,
}: StepReviewProps) {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Review your profile</CardTitle>
          <p className="text-muted-foreground text-sm">
            Confirm your settings before we start scanning for signals.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Section title="Company">
            <span className="font-medium">{data.company_name}</span>
          </Section>

          <Separator />

          <Section title="Solution categories">
            {data.solution_categories.map((c) => (
              <Badge key={c} variant="secondary">
                {c}
              </Badge>
            ))}
          </Section>

          <Section title="Problem areas">
            {data.problem_areas.map((p) => (
              <Badge key={p} variant="outline">
                {p}
              </Badge>
            ))}
          </Section>

          <Separator />

          <Section title="District types">
            {data.district_types.length === 0 ? (
              <Badge variant="secondary">All</Badge>
            ) : (
              data.district_types.map((t) => (
                <Badge key={t} variant="secondary" className="capitalize">
                  {t}
                </Badge>
              ))
            )}
          </Section>

          <Section title="District size">
            <Badge variant="secondary" className="capitalize">
              {data.district_size_range}
            </Badge>
          </Section>

          <Section title="Target regions">
            {data.target_regions.length === 0 ? (
              <Badge variant="outline" className="font-mono">
                All
              </Badge>
            ) : (
              data.target_regions.map((s) => (
                <Badge key={s} variant="outline" className="font-mono">
                  {s}
                </Badge>
              ))
            )}
          </Section>

          <Separator />

          <Section title="Funding sources">
            {data.funding_sources.map((f) => (
              <Badge key={f} variant="secondary">
                {f}
              </Badge>
            ))}
          </Section>

          <Section title="Keywords">
            {data.keywords.map((k) => (
              <Badge key={k} variant="outline">
                {k}
              </Badge>
            ))}
          </Section>

          {(data.competitor_names.length > 0 ||
            data.bellwether_districts.length > 0) && (
            <>
              <Separator />
              <Section title="Competitors">
                {data.competitor_names.map((c) => (
                  <Badge key={c} variant="secondary">
                    {c}
                  </Badge>
                ))}
              </Section>
              <Section title="Bellwether districts">
                {data.bellwether_districts.map((d) => (
                  <Badge key={d} variant="outline">
                    {d}
                  </Badge>
                ))}
              </Section>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button
          onClick={onSubmit}
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Setting up..." : "Start Scanning"}
        </Button>
      </div>
    </div>
  );
}
