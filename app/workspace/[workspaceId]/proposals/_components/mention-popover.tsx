"use client";

import { useEffect } from "react";
import { AtSign, CornerDownLeft, Loader2, Search, Users, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import type { MentionSearchResult } from "../_lib/mentions";

type Props = {
  query: string;
  results: MentionSearchResult[];
  loading: boolean;
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (result: MentionSearchResult) => void;
};

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-[4px] border border-zinc-200 bg-white px-1 font-sans text-[10px] font-medium text-zinc-600 shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </kbd>
  );
}

export default function MentionPopover({
  query,
  results,
  loading,
  activeIndex,
  onHover,
  onSelect,
}: Props) {
  // Scroll the active row into view when navigating with arrow keys.
  useEffect(() => {
    const el = document.querySelector<HTMLLIElement>(
      `[data-mention-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-violet-200/70 bg-white/95 shadow-[0_24px_60px_-20px_rgba(140,0,255,0.35),0_8px_24px_-12px_rgba(24,24,27,0.18)] ring-1 ring-violet-500/10 backdrop-blur-md dark:border-violet-900/40 dark:bg-zinc-900/95 dark:ring-violet-400/10">
      {/* brand accent strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#450693] via-[#8C00FF] to-[#c084fc]" />

      {/* header */}
      <div className="flex items-center gap-2.5 border-b border-zinc-100 bg-gradient-to-b from-violet-50/60 to-white px-3.5 py-2.5 dark:border-zinc-800 dark:from-violet-950/30 dark:to-zinc-900">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-[#8C00FF] to-[#450693] text-white shadow-sm">
          <AtSign className="h-3 w-3" strokeWidth={2.5} />
        </span>
        <div className="flex flex-1 items-center gap-1.5">
          <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            Mention a contact
          </span>
          {query.trim() ? (
            <span className="ml-1 truncate rounded-md bg-violet-100 px-1.5 py-0.5 text-[10.5px] font-medium text-violet-700 dark:bg-violet-900/40 dark:text-violet-200">
              {query}
            </span>
          ) : null}
          {loading ? (
            <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-violet-500" />
          ) : null}
        </div>
        <span className="text-[10.5px] font-medium text-zinc-400 dark:text-zinc-500">
          {results.length > 0
            ? `${results.length} match${results.length === 1 ? "" : "es"}`
            : ""}
        </span>
      </div>

      {/* results list */}
      <ul className="max-h-72 overflow-y-auto py-1.5">
        {results.length === 0 ? (
          <li className="flex flex-col items-center gap-2 px-3 py-7 text-center">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-violet-50 text-violet-500 dark:bg-violet-950/40 dark:text-violet-300">
              <Search className="h-4 w-4" />
            </span>
            <p className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-200">
              {loading
                ? "Searching…"
                : query.trim().length === 0
                  ? "Type a name, company, or email"
                  : `No matches for “${query}”`}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              Mentions pull in lead and customer context.
            </p>
          </li>
        ) : (
          results.map((r, idx) => {
            const isActive = idx === activeIndex;
            const isCustomer = r.type === "customer";
            return (
              <li
                key={`${r.type}:${r.id}`}
                data-mention-index={idx}
                // Use onMouseDown so the click registers before the textarea
                // blur handler runs and tears the popover down.
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(r);
                }}
                onMouseEnter={() => onHover(idx)}
                className={cn(
                  "group relative mx-1.5 flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 transition-colors",
                  isActive
                    ? "bg-gradient-to-r from-violet-50 to-white text-zinc-900 dark:from-violet-950/50 dark:to-zinc-900 dark:text-zinc-50"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                )}
              >
                {/* active row left accent */}
                <span
                  className={cn(
                    "absolute left-0 top-1.5 h-[calc(100%-12px)] w-[3px] rounded-r-full transition-opacity",
                    isActive
                      ? "bg-[#8C00FF] opacity-100"
                      : "opacity-0",
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full ring-2 transition",
                    isCustomer
                      ? "bg-emerald-100 text-emerald-700 ring-emerald-50 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-900/20"
                      : "bg-amber-100 text-amber-700 ring-amber-50 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-900/20",
                    isActive && "ring-4",
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
                  <p
                    className={cn(
                      "truncate text-[13px] text-zinc-900 dark:text-zinc-100",
                      isActive ? "font-semibold" : "font-medium",
                    )}
                  >
                    {r.name}
                  </p>
                  <p className="truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
                    {r.subtitle}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    isCustomer
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200",
                  )}
                >
                  {r.type}
                </span>
                {isActive ? (
                  <span className="hidden items-center gap-1 text-[10.5px] font-medium text-violet-600 dark:text-violet-300 sm:inline-flex">
                    <CornerDownLeft className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                ) : null}
              </li>
            );
          })
        )}
      </ul>

      {/* footer keyboard hints */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 bg-zinc-50/70 px-3 py-1.5 text-[10.5px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <span>navigate</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>↩</Kbd>
            <span>insert</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd>Esc</Kbd>
            <span>dismiss</span>
          </span>
        </div>
        <span className="hidden text-[10px] font-medium uppercase tracking-wide text-violet-600/80 dark:text-violet-300/80 sm:inline">
          @ mention
        </span>
      </div>
    </div>
  );
}
