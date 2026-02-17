import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Radio } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";

describe("EmptyState", () => {
  it("renders title and description", () => {
    render(
      <EmptyState
        icon={Radio}
        title="No signals yet"
        description="Your matched signals will appear here once you complete onboarding."
      />
    );
    expect(screen.getByText("No signals yet")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your matched signals will appear here once you complete onboarding."
      )
    ).toBeInTheDocument();
  });

  it("shows action button when provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={Radio}
        title="No results"
        description="Try adjusting your filters."
        action={{
          label: "Clear filters",
          onClick,
        }}
      />
    );
    const button = screen.getByRole("button", { name: "Clear filters" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders action as link when href is provided", () => {
    render(
      <EmptyState
        icon={Radio}
        title="Get started"
        action={{
          label: "Go to onboarding",
          href: "/onboarding",
        }}
      />
    );
    const link = screen.getByRole("link", { name: "Go to onboarding" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/onboarding");
  });

  it("renders without description when not provided", () => {
    render(<EmptyState icon={Radio} title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});
