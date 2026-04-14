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

export function ReMatchButton({
  disabled,
  className,
}: {
  disabled?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(className)}
      onClick={handleClick}
      disabled={disabled ?? loading}
    >
      {loading ? (
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
