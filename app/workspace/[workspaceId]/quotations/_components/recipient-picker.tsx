"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  Search,
  Sparkles,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import Button from "@/components/button";
import Input from "@/components/input";
import Popup from "@/components/popup";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import {
  searchQuotationRecipients,
  type RecipientResult,
} from "../actions";

type Tab = "existing" | "custom";

type Props = {
  open: boolean;
  workspaceId: string;
  onOpenChange: (next: boolean) => void;
  onSelect: (recipient: RecipientResult) => void;
};

export default function RecipientPicker({
  open,
  workspaceId,
  onOpenChange,
  onSelect,
}: Props) {
  const [tab, setTab] = useState<Tab>("existing");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipientResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  // Custom recipient form state.
  const [customName, setCustomName] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);

  // Reset on each open + load an initial unfiltered batch.
  useEffect(() => {
    if (!open) return;
    setTab("existing");
    setQuery("");
    setActiveIdx(0);
    setCustomName("");
    setCustomCompany("");
    setCustomEmail("");
    setCustomError(null);
    let cancelled = false;
    setLoading(true);
    searchQuotationRecipients(workspaceId, "").then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (res.ok) setResults(res.results);
    });
    return () => {
      cancelled = true;
    };
  }, [open, workspaceId]);

  // Debounced search on query changes (only when the existing tab is active).
  useEffect(() => {
    if (!open || tab !== "existing") return;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      const res = await searchQuotationRecipients(workspaceId, query);
      setLoading(false);
      if (res.ok) {
        setResults(res.results);
        setActiveIdx(0);
      }
    }, 150);
    return () => window.clearTimeout(handle);
  }, [query, open, workspaceId, tab]);

  function submitCustom() {
    const name = customName.trim();
    if (!name) {
      setCustomError("Name is required.");
      return;
    }
    onSelect({
      kind: "custom",
      id: "",
      name,
      company: customCompany.trim(),
      email: customEmail.trim(),
    });
    onOpenChange(false);
  }

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
        onOpenChange(false);
      }
    }
  }

  return (
    <Popup
      open={open}
      onOpenChange={onOpenChange}
      className="max-h-[80vh] overflow-hidden sm:max-w-xl"
    >
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
          <DialogTitle className="text-[17px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
            Select recipient
          </DialogTitle>
          <DialogDescription className="mt-1 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Pick from your customers and leads, or enter a one-off recipient.
          </DialogDescription>

          {/* Tabs */}
          <div className="mt-4 inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setTab("existing")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                tab === "existing"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              <Search className="h-3 w-3" />
              From CRM
            </button>
            <button
              type="button"
              onClick={() => setTab("custom")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors",
                tab === "custom"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              )}
            >
              <UserPlus className="h-3 w-3" />
              Custom
            </button>
          </div>

          {tab === "existing" ? (
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
                placeholder="Search by name, company, or email…"
                className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-[13.5px] text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              {loading ? (
                <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {tab === "existing" ? (
        <>
          <div className="max-h-[55vh] overflow-y-auto px-2 py-2">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
                {loading
                  ? "Searching…"
                  : query.trim()
                    ? `No customers or leads match “${query.trim()}”.`
                    : "No customers or leads yet in this workspace or assigned to you."}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {results.map((r, idx) => {
                  const isActive = idx === activeIdx;
                  const isCustomer = r.kind === "customer";
                  return (
                    <li key={`${r.kind}:${r.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => {
                          onSelect(r);
                          onOpenChange(false);
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
                            isCustomer
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
                          )}
                          aria-hidden
                        >
                          {isCustomer ? (
                            <Users className="h-3.5 w-3.5" />
                          ) : (
                            <UserRound className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
                              {r.name}
                            </span>
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider",
                                isCustomer
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
                              )}
                            >
                              {r.kind}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                            {r.company ? (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {r.company}
                              </span>
                            ) : null}
                            {r.company && r.email ? " · " : ""}
                            {r.email}
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
              {results.length}{" "}
              {results.length === 1 ? "result" : "results"}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
            <p className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[11.5px] text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
              <Sparkles className="h-3 w-3" />
              For a one-off recipient. Not saved as a customer or lead — only
              snapshotted on the quotation.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor="custom-name"
                  className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Name *
                </label>
                <div className="relative mt-2">
                  <UserRound
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <Input
                    id="custom-name"
                    autoFocus
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      if (customError) setCustomError(null);
                    }}
                    placeholder="Recipient name"
                    maxLength={160}
                    className="pl-9"
                  />
                </div>
                {customError ? (
                  <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                    {customError}
                  </p>
                ) : null}
              </div>
              <div>
                <label
                  htmlFor="custom-company"
                  className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Company
                </label>
                <div className="relative mt-2">
                  <Building2
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <Input
                    id="custom-company"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Acme Corp"
                    maxLength={160}
                    className="pl-9"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="custom-email"
                  className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Email
                </label>
                <div className="relative mt-2">
                  <Mail
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  />
                  <Input
                    id="custom-email"
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/60 px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900/60">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
              The recipient lives only on this quotation.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={submitCustom}
              >
                <UserPlus className="h-3.5 w-3.5" />
                Use this recipient
              </Button>
            </div>
          </div>
        </>
      )}
    </Popup>
  );
}
