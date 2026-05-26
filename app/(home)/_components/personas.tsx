"use client";

import { useState, type ReactNode } from "react";
import Eyebrow from "@/components/eyebrow";
import { cn } from "@/lib/cn";
import {
  BarChart3,
  Briefcase,
  Calculator,
  FolderKanban,
  IdCard,
  UserPlus,
} from "lucide-react";

type Persona = {
  id: string;
  label: string;
  role: string;
  icon: ReactNode;
  headline: string;
  description: string;
  highlights: string[];
};

const personas: Persona[] = [
  {
    id: "sales",
    label: "Sales",
    role: "Sales Executive",
    icon: <UserPlus className="h-4 w-4" />,
    headline: "Close more, log less.",
    description:
      "A focused inbox of leads and deals. Drag through stages, log calls, and let AI draft the next proposal.",
    highlights: [
      "Drag-and-drop pipeline by stage",
      "AI-drafted proposals & quotations",
      "Tasks and follow-ups by contact",
    ],
  },
  {
    id: "pm",
    label: "Projects",
    role: "Project Manager",
    icon: <FolderKanban className="h-4 w-4" />,
    headline: "From won deal to delivered work.",
    description:
      "Turn signed deals into projects with one click. Milestones, tasks, and files — all in the same workspace.",
    highlights: [
      "Per-project tasks, milestones & files",
      "Calendar view of upcoming work",
      "Team-only project sidebar",
    ],
  },
  {
    id: "accounts",
    label: "Accounts",
    role: "Accountant",
    icon: <Calculator className="h-4 w-4" />,
    headline: "Tally-style vouchers, modern UI.",
    description:
      "Sales orders, invoices, receipts, purchase orders, and payments — wired together, with recovery built in.",
    highlights: [
      "Itemized & money vouchers",
      "Auto-linked customers & vendors",
      "Receivables & recovery tracking",
    ],
  },
  {
    id: "hr",
    label: "HR",
    role: "HR Manager",
    icon: <IdCard className="h-4 w-4" />,
    headline: "One place to onboard your team.",
    description:
      "Add employees, assign roles, and control exactly which modules each person can see.",
    highlights: [
      "Eight built-in roles out of the box",
      "Per-role module access control",
      "Single sign-on with Google",
    ],
  },
  {
    id: "owner",
    label: "Owner",
    role: "Founder / Owner",
    icon: <Briefcase className="h-4 w-4" />,
    headline: "Run your whole business from one tab.",
    description:
      "A role-aware dashboard that puts sales, projects, cash, and headcount on the same screen.",
    highlights: [
      "Executive overview with live KPIs",
      "Multi-workspace support",
      "Audit-friendly per-workspace data",
    ],
  },
];

export default function Personas() {
  const [active, setActive] = useState(personas[0].id);
  const activePersona = personas.find((p) => p.id === active) ?? personas[0];

  return (
    <section
      id="roles"
      className="relative border-b border-zinc-200 py-24 dark:border-zinc-800"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_100%,rgba(225,42,251,0.08),transparent_70%)] dark:bg-[radial-gradient(60%_50%_at_50%_100%,rgba(225,42,251,0.14),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Built for every role</Eyebrow>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            One workspace. Every team. Their own view.
          </h2>
          <p className="mt-4 text-balance text-zinc-600 dark:text-zinc-400">
            Sidebar, dashboard, and permissions adapt to each role — so people
            see what they need, and nothing they don&apos;t.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div
            role="tablist"
            aria-label="Roles"
            className="flex flex-wrap gap-2 lg:col-span-4 lg:flex-col lg:gap-2"
          >
            {personas.map((p) => {
              const isActive = p.id === active;
              return (
                <button
                  key={p.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  onClick={() => setActive(p.id)}
                  className={cn(
                    "group flex flex-1 items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-all lg:flex-none",
                    isActive
                      ? "border-primary/40 bg-linear-to-r from-primary/10 to-secondary/10 shadow-sm dark:border-primary/50"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-9 w-9 shrink-0 place-items-center rounded-md ring-1 ring-inset transition-colors",
                      isActive
                        ? "bg-linear-to-br from-primary to-secondary text-white ring-transparent"
                        : "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
                    )}
                  >
                    {p.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {p.label}
                    </p>
                    <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                      {p.role}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-8">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                  {activePersona.icon}
                  {activePersona.role}
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
                {activePersona.headline}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-600 dark:text-zinc-400">
                {activePersona.description}
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {activePersona.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 py-2.5 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300"
                  >
                    <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-xl border border-dashed border-zinc-200 bg-linear-to-br from-primary/5 to-secondary/5 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
                    {activePersona.label} dashboard
                  </p>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500">
                    Live preview
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="rounded-md border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="h-2 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="mt-2 h-5 w-16 rounded-md bg-linear-to-r from-primary/30 to-secondary/30" />
                      <div className="mt-2 flex items-end gap-0.5">
                        {[8, 14, 6, 18, 10, 22, 16].map((h, j) => (
                          <span
                            key={j}
                            className="w-1 rounded-sm bg-linear-to-t from-primary/60 to-secondary/60"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
