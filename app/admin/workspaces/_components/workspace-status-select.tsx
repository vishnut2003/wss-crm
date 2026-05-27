"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  WORKSPACE_STATUSES,
  WORKSPACE_STATUS_LABEL,
  type WorkspaceStatus,
} from "@/lib/workspace";
import { setWorkspaceStatus } from "../actions";

export default function WorkspaceStatusSelect({
  workspaceId,
  status,
}: {
  workspaceId: string;
  status: WorkspaceStatus;
}) {
  const [value, setValue] = useState<WorkspaceStatus>(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleChange = (next: string) => {
    const prev = value;
    setValue(next as WorkspaceStatus);
    setError(null);
    startTransition(async () => {
      const result = await setWorkspaceStatus(workspaceId, next);
      if (!result.ok) {
        setValue(prev);
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Select value={value} onValueChange={handleChange} disabled={pending}>
        <SelectTrigger
          size="sm"
          className={cn("w-[140px]", pending && "opacity-60")}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {WORKSPACE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {WORKSPACE_STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? (
        <span className="text-[11px] text-red-600 dark:text-red-400">
          {error}
        </span>
      ) : null}
    </div>
  );
}
