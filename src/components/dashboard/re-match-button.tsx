"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  pollRematchUntilTerminal,
  requestProfileRematch,
  toastRematchOutcome,
} from "@/lib/profile-rematch";
import { cn } from "@/lib/utils";

export function ReMatchButton({ className }: { className?: string }) {
  const [requestInFlight, setRequestInFlight] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setRequestInFlight(true);
    try {
      const result = await requestProfileRematch();
      if (!result.ok) {
        throw new Error(result.error);
      }
      toast.success(result.message);
      router.refresh();
      void (async () => {
        try {
          const final = await pollRematchUntilTerminal();
          toastRematchOutcome(final, toast);
          router.refresh();
        } catch {
          toast.message("Could not confirm scan status — refresh the page later.");
        }
      })();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRequestInFlight(false);
    }
  };

  return (
    <Button
      type="button"
      variant="default"
      className={cn(className)}
      onClick={handleClick}
      disabled={requestInFlight}
      aria-busy={requestInFlight}
    >
      {requestInFlight ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Scanning…
        </>
      ) : (
        "Scan again"
      )}
    </Button>
  );
}
