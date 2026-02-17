"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepCompany } from "./step-company";
import { StepMarket } from "./step-market";
import { StepFunding } from "./step-funding";
import { StepCompetitors } from "./step-competitors";
import { StepReview } from "./step-review";
import type {
  OnboardingStep1,
  OnboardingStep2,
  OnboardingStep3,
  OnboardingStep4,
} from "@/types/schemas";

const STEP_TITLES = [
  "Your Company",
  "Target Market",
  "Funding & Signals",
  "Competitive Landscape",
  "Review & Launch",
] as const;

type OnboardingFormData = Partial<
  OnboardingStep1 & OnboardingStep2 & OnboardingStep3 & OnboardingStep4
>;

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<OnboardingFormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / STEP_TITLES.length) * 100;

  const handleNext = () => {
    setCurrentStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handleStep1Change = (data: OnboardingStep1) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleStep2Change = (data: OnboardingStep2) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleStep3Change = (data: OnboardingStep3) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleStep4Change = (data: OnboardingStep4) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/profiles/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save onboarding");
      }

      toast.success("Profile saved! Redirecting to your dashboard...");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set up your signal profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Step {currentStep + 1} of {STEP_TITLES.length}: {STEP_TITLES[currentStep]}
        </p>
        <Progress value={progress} className="h-2" />
      </div>

      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">{STEP_TITLES[currentStep]}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && (
            <StepCompany
              data={formData}
              onChange={handleStep1Change}
              onNext={handleNext}
            />
          )}
          {currentStep === 1 && (
            <StepMarket
              data={formData}
              onChange={handleStep2Change}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 2 && (
            <StepFunding
              data={formData}
              onChange={handleStep3Change}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 3 && (
            <StepCompetitors
              data={formData}
              onChange={handleStep4Change}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {currentStep === 4 && (
            <StepReview
              data={formData as OnboardingStep1 & OnboardingStep2 & OnboardingStep3 & OnboardingStep4}
              onSubmit={handleSubmit}
              onBack={handleBack}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
