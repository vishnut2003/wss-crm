"use client";

import { useState, useTransition } from "react";
import { Ban, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { setUserDisabled } from "../actions";

export default function UserDisableToggle({
  userId,
  disabled,
  locked,
  lockedReason,
}: {
  userId: string;
  disabled: boolean;
  /** Protected user (self or platform admin) — control is read-only. */
  locked?: boolean;
  lockedReason?: string;
}) {
  const [isDisabled, setIsDisabled] = useState(disabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (locked) {
    return (
      <span
        title={lockedReason}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-zinc-400 dark:text-zinc-500"
      >
        <Check className="h-3.5 w-3.5" />
        Enabled
      </span>
    );
  }

  const toggle = () => {
    const next = !isDisabled;
    setIsDisabled(next);
    setError(null);
    startTransition(async () => {
      const result = await setUserDisabled(userId, next);
      if (!result.ok) {
        setIsDisabled(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={isDisabled}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-60",
          isDisabled
            ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/70",
        )}
      >
        {isDisabled ? (
          <>
            <Ban className="h-3.5 w-3.5" />
            Disabled
          </>
        ) : (
          <>
            <Check className="h-3.5 w-3.5" />
            Enabled
          </>
        )}
      </button>
      {error ? (
        <span className="text-[11px] text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
