import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScanHistoryView } from "@/components/dashboard/scan-history-view";
import * as rematchClient from "@/lib/rematch-runs-client";
import type { RematchRunListRow } from "@/lib/rematch-runs-client";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const runningRun: RematchRunListRow = {
  id: "run-1",
  status: "running",
  error_message: null,
  signals_considered: 1,
  candidates_total: 10,
  inserted: 0,
  updated: 0,
  started_at: "2026-01-01T12:00:00.000Z",
  finished_at: null,
};

describe("ScanHistoryView", () => {
  beforeEach(() => {
    vi.spyOn(rematchClient, "cancelRematchRun").mockResolvedValue(undefined);
    vi.spyOn(rematchClient, "fetchRematchRuns").mockResolvedValue([runningRun]);
  });

  it("opens a confirmation dialog when Cancel is clicked; Keep running closes without calling the API", async () => {
    render(<ScanHistoryView initialRuns={[runningRun]} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByRole("heading", { name: "Cancel this scan?" })).toBeInTheDocument();
    expect(rematchClient.cancelRematchRun).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Keep running" }));

    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Cancel this scan?" })).not.toBeInTheDocument();
    });
    expect(rematchClient.cancelRematchRun).not.toHaveBeenCalled();
  });

  it("calls cancelRematchRun when Stop scan is confirmed", async () => {
    render(<ScanHistoryView initialRuns={[runningRun]} />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop scan" }));

    await waitFor(() => {
      expect(rematchClient.cancelRematchRun).toHaveBeenCalledWith("run-1");
    });
  });
});
