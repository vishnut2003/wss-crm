"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_DOT_CLASS,
  QUOTATION_STATUS_LABEL,
} from "@/lib/quotation";

type Member = { id: string; name: string };

type Props = {
  members: Member[];
  currentUserId: string;
  showAssigneeFilter?: boolean;
};

export default function QuotationsToolbar({
  members,
  currentUserId,
  showAssigneeFilter = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const q = params.get("q") ?? "";
  const status = params.get("status") ?? "all";
  const kind = params.get("kind") ?? "all";
  const assignee = params.get("assignee") ?? "all";

  const [localQ, setLocalQ] = useState(q);
  const [lastSyncedQ, setLastSyncedQ] = useState(q);
  if (q !== lastSyncedQ) {
    setLastSyncedQ(q);
    setLocalQ(q);
  }

  const navigate = (next: URLSearchParams) => {
    const qs = next.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  };

  const setParam = (key: string, value: string, defaultValue: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === defaultValue) next.delete(key);
    else next.set(key, value);
    navigate(next);
  };

  const handleSubmitQuery = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setParam("q", localQ.trim(), "");
  };

  const clearAll = () => {
    setLocalQ("");
    navigate(new URLSearchParams());
  };

  const hasAnyFilter =
    q ||
    status !== "all" ||
    kind !== "all" ||
    (showAssigneeFilter && assignee !== "all");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={handleSubmitQuery}
          className="relative min-w-[220px] flex-1"
        >
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          />
          <input
            type="search"
            value={localQ}
            onChange={(e) => setLocalQ(e.target.value)}
            onBlur={() => setParam("q", localQ.trim(), "")}
            placeholder="Search number or recipient…"
            className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-[13px] text-zinc-900 placeholder:text-zinc-500 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 [&::-webkit-search-cancel-button]:appearance-none"
          />
        </form>

        <Select
          value={status}
          onValueChange={(v) => setParam("status", v, "all")}
        >
          <SelectTrigger
            size="sm"
            aria-label="Status"
            className="w-auto min-w-[140px]"
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {QUOTATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                <span className="inline-flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      QUOTATION_STATUS_DOT_CLASS[s],
                    )}
                  />
                  {QUOTATION_STATUS_LABEL[s]}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={kind}
          onValueChange={(v) => setParam("kind", v, "all")}
        >
          <SelectTrigger
            size="sm"
            aria-label="Recipient kind"
            className="w-auto min-w-[140px]"
          >
            <SelectValue placeholder="Recipient" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All recipients</SelectItem>
            <SelectItem value="customer">Customers only</SelectItem>
            <SelectItem value="lead">Leads only</SelectItem>
            <SelectItem value="custom">Custom only</SelectItem>
          </SelectContent>
        </Select>

        {showAssigneeFilter ? (
          <Select
            value={assignee}
            onValueChange={(v) => setParam("assignee", v, "all")}
          >
            <SelectTrigger
              size="sm"
              aria-label="Owner"
              className="w-auto min-w-[140px]"
            >
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="me">Owned by me</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {members
                .filter((m) => m.id !== currentUserId)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        ) : null}

        {hasAnyFilter ? (
          <button
            type="button"
            onClick={clearAll}
            disabled={pending}
            className="inline-flex h-9 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
