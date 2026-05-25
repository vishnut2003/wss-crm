"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import Button from "@/components/button";
import Popup from "@/components/popup";
import { deleteProjectFile } from "../actions";

export default function DeleteFileButton({
  workspaceId,
  projectId,
  fileId,
  fileName,
}: {
  workspaceId: string;
  projectId: string;
  fileId: string;
  fileName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteProjectFile(workspaceId, projectId, fileId);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        aria-label={`Remove ${fileName}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <Popup
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
        }}
        title="Remove file"
        description={`This removes “${fileName}” from the project. This can't be undone.`}
        className="sm:max-w-md"
      >
        <div className="px-6 pb-6 pt-2">
          {error ? (
            <p
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
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
              onClick={confirmDelete}
              disabled={pending}
              aria-busy={pending}
              className="!from-rose-500 !to-red-600"
            >
              {pending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Removing…
                </>
              ) : (
                "Remove"
              )}
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}
