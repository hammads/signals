import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SignalCard } from "@/components/shared/signal-card";
import type { ReactNode } from "react";

function Wrapper({ children }: { children: ReactNode }) {
  return <TooltipProvider>{children}</TooltipProvider>;
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: "/",
    query: {},
  }),
}));

const mockSignal = {
  title: "Austin ISD Releases New RFP for Literacy Platform",
  source_url: "https://example.com/rfp",
  signal_category: "rfp" as const,
  region: "TX",
  published_at: "2025-02-17T00:00:00Z",
  created_at: "2025-02-17T00:00:00Z",
  metadata: {},
};

const defaultProps = {
  signal: mockSignal,
  relevance_score: 0.85,
  why_it_matters: "This RFP aligns with your literacy product focus.",
  action_suggestion: "Submit a proposal before the March 15 deadline.",
  is_read: false,
  is_bookmarked: false,
  onBookmarkToggle: vi.fn(),
  onMarkRead: vi.fn(),
};

describe("SignalCard", () => {
  it("renders signal title", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    expect(
      screen.getByText("Austin ISD Releases New RFP for Literacy Platform")
    ).toBeInTheDocument();
  });

  it("shows category badge", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText("RFP")).toBeInTheDocument();
  });

  it("shows 'Why This Matters' text", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText("Why This Matters")).toBeInTheDocument();
    expect(
      screen.getByText("This RFP aligns with your literacy product focus.")
    ).toBeInTheDocument();
  });

  it("shows action suggestion", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.getByText("Suggested Action")).toBeInTheDocument();
    expect(
      screen.getByText("Submit a proposal before the March 15 deadline.")
    ).toBeInTheDocument();
  });

  it("bookmark button works (fires callback)", () => {
    const onBookmarkToggle = vi.fn();
    render(
      <SignalCard {...defaultProps} onBookmarkToggle={onBookmarkToggle} />,
      { wrapper: Wrapper }
    );
    const bookmarkButton = screen.getByRole("button", {
      name: /bookmark/i,
    });
    fireEvent.click(bookmarkButton);
    expect(onBookmarkToggle).toHaveBeenCalledTimes(1);
  });

  it("external link has correct href", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    const links = screen.getAllByRole("link", { name: /austin isd/i });
    const titleLink = links.find(
      (l) => l.getAttribute("href") === "https://example.com/rfp"
    );
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "https://example.com/rfp");
  });

  it("View Source button has correct href when source_url exists", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    const viewSourceButton = screen.getByRole("link", {
      name: /view source/i,
    });
    expect(viewSourceButton).toHaveAttribute(
      "href",
      "https://example.com/rfp"
    );
  });

  it("shows preparing insight when blurbs are missing and insight is pending", () => {
    render(
      <SignalCard
        {...defaultProps}
        why_it_matters={null}
        action_suggestion={null}
        insightPending
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText(/preparing personalized insight/i)
    ).toBeInTheDocument();
  });

  it("shows generating text when insight is loading", () => {
    render(
      <SignalCard
        {...defaultProps}
        why_it_matters={null}
        action_suggestion={null}
        insightPending
        insightLoading
      />,
      { wrapper: Wrapper }
    );
    expect(
      screen.getByText(/generating personalized insight/i)
    ).toBeInTheDocument();
  });

  it("shows 'via' source label from RSS metadata feedTitle", () => {
    render(
      <SignalCard
        {...defaultProps}
        signal={{ ...mockSignal, metadata: { feedTitle: "EdWeek RSS" } }}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/via EdWeek RSS/)).toBeInTheDocument();
  });

  it("shows 'via' source label from scrape metadata parentSourceName", () => {
    render(
      <SignalCard
        {...defaultProps}
        signal={{
          ...mockSignal,
          metadata: { parentSourceName: "HigherGov K-12 Bids" },
        }}
      />,
      { wrapper: Wrapper }
    );
    expect(screen.getByText(/via HigherGov K-12 Bids/)).toBeInTheDocument();
  });

  it("does not show 'via' when metadata has no source label", () => {
    render(<SignalCard {...defaultProps} />, { wrapper: Wrapper });
    expect(screen.queryByText(/via /)).not.toBeInTheDocument();
  });
});
