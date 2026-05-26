"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import Button from "@/components/button";
import Popup from "@/components/popup";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { recordInvoiceFollowUp } from "../../sale-invoices/actions";

type Props = {
  workspaceId: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
};

export default function FollowUpButton({
  workspaceId,
  invoiceId,
  invoiceNumber,
  customerName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await recordInvoiceFollowUp(workspaceId, invoiceId, note);
      if (res.ok) {
        setOpen(false);
        setNote("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus className="h-3 w-3" />
        Note
      </Button>
      <Popup open={open} onOpenChange={setOpen} className="sm:max-w-md">
        <div className="space-y-4 p-6">
          <div>
            <DialogTitle className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
              Record follow-up
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
              Add a quick note about chasing{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {invoiceNumber}
              </span>{" "}
              with {customerName}.
            </DialogDescription>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            maxLength={2000}
            autoFocus
            placeholder="E.g. Called accounts dept — they'll process by Friday."
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={submit}
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <MessageSquarePlus className="h-3.5 w-3.5" />
              )}
              Save note
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}
