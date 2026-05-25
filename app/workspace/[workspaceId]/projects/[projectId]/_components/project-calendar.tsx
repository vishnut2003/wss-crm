"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Flag, ListTodo } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  TASK_STATUS_BADGE_CLASS,
  TASK_STATUS_DOT_CLASS,
  TASK_STATUS_LABEL,
  type TaskStatus,
} from "@/lib/task";
import {
  MILESTONE_STATUS_BADGE_CLASS,
  MILESTONE_STATUS_LABEL,
  type MilestoneStatus,
} from "@/lib/milestone";

export type CalendarEvent = {
  id: string;
  type: "task" | "milestone";
  title: string;
  date: string; // yyyy-MM-dd
  status: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function dotClass(ev: CalendarEvent): string {
  if (ev.type === "milestone") return "bg-violet-500";
  return TASK_STATUS_DOT_CLASS[ev.status as TaskStatus] ?? "bg-zinc-400";
}

export default function ProjectCalendar({
  workspaceId,
  projectId,
  events,
  todayKey,
}: {
  workspaceId: string;
  projectId: string;
  events: CalendarEvent[];
  todayKey: string;
}) {
  const [month, setMonth] = useState<Date>(() =>
    startOfMonth(parseISO(todayKey)),
  );
  const [selectedKey, setSelectedKey] = useState<string>(todayKey);

  const base = `/workspace/${workspaceId}/projects/${projectId}`;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const list = map.get(ev.date);
      if (list) list.push(ev);
      else map.set(ev.date, [ev]);
    }
    return map;
  }, [events]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [month]);

  const selectedEvents = eventsByDay.get(selectedKey) ?? [];
  const monthKey = format(month, "yyyy-MM");

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
          {format(month, "MMMM yyyy")}
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
            className="grid h-7 w-7 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setMonth(startOfMonth(parseISO(todayKey)));
              setSelectedKey(todayKey);
            }}
            className="h-7 rounded-md border border-zinc-200 bg-white px-2.5 text-[11.5px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
            className="grid h-7 w-7 place-items-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = format(day, "yyyy-MM") === monthKey;
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const dayEvents = eventsByDay.get(key) ?? [];
          const shown = dayEvents.slice(0, 2);
          const extra = dayEvents.length - shown.length;

          return (
            <button
              type="button"
              key={key}
              onClick={() => setSelectedKey(key)}
              className={cn(
                "flex min-h-[78px] flex-col gap-1 border-b border-r border-zinc-100 p-1.5 text-left transition-colors last:border-r-0 dark:border-zinc-800/70",
                "[&:nth-child(7n)]:border-r-0",
                inMonth
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50/60 dark:bg-zinc-950/30",
                isSelected
                  ? "ring-2 ring-inset ring-primary/40"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
              )}
            >
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full text-[11px] tabular-nums",
                  isToday
                    ? "bg-gradient-to-br from-primary to-secondary font-semibold text-white"
                    : inMonth
                      ? "text-zinc-700 dark:text-zinc-300"
                      : "text-zinc-400 dark:text-zinc-600",
                )}
              >
                {format(day, "d")}
              </span>

              <span className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                {shown.map((ev) => (
                  <span
                    key={ev.id}
                    title={ev.title}
                    className={cn(
                      "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[9.5px] font-medium",
                      ev.type === "milestone"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {ev.type === "milestone" ? (
                      <Flag className="h-2 w-2 shrink-0" />
                    ) : (
                      <span
                        className={cn(
                          "h-1.5 w-1.5 shrink-0 rounded-full",
                          dotClass(ev),
                        )}
                      />
                    )}
                    <span className="truncate">{ev.title}</span>
                  </span>
                ))}
                {extra > 0 ? (
                  <span className="px-1 text-[9.5px] font-medium text-zinc-400 dark:text-zinc-500">
                    +{extra} more
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected day panel */}
      <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-[12.5px] font-semibold text-zinc-900 dark:text-zinc-100">
            {format(parseISO(selectedKey), "EEEE, MMM d")}
          </p>
          <div className="flex items-center gap-3 text-[10.5px] text-zinc-400 dark:text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <ListTodo className="h-3 w-3" />
              Task
            </span>
            <span className="inline-flex items-center gap-1">
              <Flag className="h-3 w-3 text-violet-500" />
              Milestone
            </span>
          </div>
        </div>

        {selectedEvents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-[12px] text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
            Nothing scheduled for this day.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedEvents.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={
                    ev.type === "milestone"
                      ? `${base}/milestones`
                      : `${base}/tasks`
                  }
                  className="flex items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40"
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md",
                      ev.type === "milestone"
                        ? "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                    )}
                  >
                    {ev.type === "milestone" ? (
                      <Flag className="h-3 w-3" />
                    ) : (
                      <ListTodo className="h-3 w-3" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-zinc-800 dark:text-zinc-200">
                    {ev.title}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                      ev.type === "milestone"
                        ? MILESTONE_STATUS_BADGE_CLASS[
                            ev.status as MilestoneStatus
                          ]
                        : TASK_STATUS_BADGE_CLASS[ev.status as TaskStatus],
                    )}
                  >
                    {ev.type === "milestone"
                      ? MILESTONE_STATUS_LABEL[ev.status as MilestoneStatus]
                      : TASK_STATUS_LABEL[ev.status as TaskStatus]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
