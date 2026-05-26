"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  Search,
  Truck,
  UserRound,
  Users,
} from "lucide-react";
import Popup from "@/components/popup";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { PartyKind, PartyResult } from "@/lib/voucher";
import { searchParties } from "@/lib/party-actions";

type Props = {
  open: boolean;
  workspaceId: string;
  kind: PartyKind;
  onOpenChange: (next: boolean) => void;
  onSelect: (party: PartyResult) => void;
};

export default function PartyPicker({
  open,
  workspaceId,
  kind,
  onOpenChange,
  onSelect,
}: Props) {
  return (
    <Popup
      open={open}
      onOpenChange={onOpenChange}
      className="max-h-[80vh] overflow-hidden sm:max-w-xl"
    >
      {open ? (
        <PickerBody
          workspaceId={workspaceId}
          kind={kind}
          onSelect={onSelect}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Popup>
  );
}

function PickerBody({
  workspaceId,
  kind,
  onSelect,
  onClose,
}: {
  workspaceId: string;
  kind: PartyKind;
  onSelect: (party: PartyResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PartyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setLoading(true);
      const res = await searchParties(workspaceId, kind, query);
      setLoading(false);
      if (res.ok) {
        setResults(res.results);
        setActiveIdx(0);
      }
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, workspaceId, kind]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) =>
        results.length === 0 ? 0 : (i + 1) % results.length,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) =>
        results.length === 0
          ? 0
          : (i - 1 + results.length) % results.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const picked = results[activeIdx];
      if (picked) {
        onSelect(picked);
        onClose();
      }
    }
  }

  const Icon = kind === "customer" ? Users : Truck;
  const heading = kind === "customer" ? "Select customer" : "Select vendor";
  const description =
    kind === "customer"
      ? "Pick a customer from this workspace."
      : "Pick an active vendor from this workspace.";

  return (
    <>
      <div className="relative overflow-hidden border-b border-zinc-100 dark:border-zinc-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-white to-secondary/[0.05] dark:from-primary/[0.16] dark:via-zinc-900 dark:to-secondary/[0.12]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/30 to-secondary/20 opacity-50 blur-3xl"
        />
        <div className="relative px-6 pb-4 pt-6">
          <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
            <Icon className="h-4 w-4 text-primary" />
            {heading}
          </DialogTitle>
          <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </DialogDescription>

          <div className="relative mt-3">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                kind === "customer"
                  ? "Search by name, company, email, or GSTIN…"
                  : "Search by name, company, email, or GSTIN…"
              }
              className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-[13.5px] text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            />
            {loading ? (
              <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-2 py-2">
        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
            {loading
              ? "Searching…"
              : query.trim()
                ? `No ${kind === "customer" ? "customers" : "vendors"} match “${query.trim()}”.`
                : kind === "customer"
                  ? "No customers yet in this workspace."
                  : "No active vendors yet. Add one from the Vendors page."}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {results.map((r, idx) => {
              const isActive = idx === activeIdx;
              return (
                <li key={`${r.kind}:${r.id}`}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => {
                      onSelect(r);
                      onClose();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-primary/[0.06] dark:bg-primary/10"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full",
                        kind === "customer"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                      )}
                      aria-hidden
                    >
                      {kind === "customer" ? (
                        <UserRound className="h-3.5 w-3.5" />
                      ) : (
                        <Truck className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
                          {r.name}
                        </span>
                        {r.gstin ? (
                          <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] tracking-tight text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            {r.gstin}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                        {r.company ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {r.company}
                          </span>
                        ) : null}
                        {r.company && r.email ? " · " : ""}
                        {r.email ? (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {r.email}
                          </span>
                        ) : null}
                        {!r.company && !r.email ? "No contact details" : ""}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-3 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500">
        <span>↑↓ to navigate · Enter to select · Esc to dismiss</span>
        <span>
          {results.length} {results.length === 1 ? "result" : "results"}
        </span>
      </div>
    </>
  );
}
