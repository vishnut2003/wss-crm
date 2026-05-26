import type { ReactNode } from "react";
import Eyebrow from "@/components/eyebrow";
import {
  ArrowUpRight,
  Building2,
  Check,
  CreditCard,
  FileText,
  FolderKanban,
  IdCard,
  Receipt,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

type ModuleCard = {
  title: string;
  body: string;
  icon: ReactNode;
  span?: string;
  visual?: ReactNode;
  badge?: string;
};

const modules: ModuleCard[] = [
  {
    title: "Customers & CRM",
    body:
      "A single source of truth for every customer. Notes, tasks, deals, and history — always one click away.",
    span: "lg:col-span-2",
    icon: <Users className="h-5 w-5" />,
    visual: <CustomersVisual />,
  },
  {
    title: "Leads & Pipeline",
    body:
      "Track prospects from new to won across drag-and-drop stages tailored to your team.",
    icon: <UserPlus className="h-5 w-5" />,
  },
  {
    title: "AI Proposals",
    badge: "New",
    body:
      "Draft proposals and quotes in seconds. Iterate over chat, export to PDF, send for signature.",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    title: "Projects & Tasks",
    body:
      "Turn won deals into delivery. Milestones, tasks, files, and a calendar — per project.",
    icon: <FolderKanban className="h-5 w-5" />,
  },
  {
    title: "Accounts & Vouchers",
    body:
      "Tally-style sales orders, invoices, receipts, purchase orders, and payments — built in.",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    title: "HR, Roles & Workspaces",
    body:
      "Onboard employees, assign one of eight roles, and keep teams isolated per workspace — with audit trails and granular access.",
    span: "lg:col-span-3",
    icon: <IdCard className="h-5 w-5" />,
    visual: <RolesVisual />,
  },
];

export default function Modules() {
  return (
    <section
      id="modules"
      className="border-b border-zinc-200 py-24 dark:border-zinc-800"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="max-w-2xl">
          <Eyebrow>Modules</Eyebrow>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            A complete operating system for your business.
          </h2>
          <p className="mt-4 text-balance text-zinc-600 dark:text-zinc-400">
            Six tightly integrated modules. One workspace. No more bouncing
            between CRMs, project trackers, and accounting tools.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <article
              key={m.title}
              className={`group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-primary/40 ${m.span ?? ""}`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-linear-to-br from-primary/20 to-secondary/20 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-linear-to-br from-primary/15 to-secondary/15 text-primary ring-1 ring-inset ring-primary/20">
                    {m.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {m.title}
                      </h3>
                      {m.badge ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-primary to-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                          <Sparkles className="h-2.5 w-2.5" />
                          {m.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                      {m.body}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-zinc-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary dark:text-zinc-700" />
              </div>
              {m.visual}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomersVisual() {
  const rows = [
    { name: "Acme Co", owner: "JD", deals: 4, value: "$48k", status: "Active" },
    { name: "Hooli", owner: "AS", deals: 7, value: "$112k", status: "Active" },
    { name: "Wayne & Co", owner: "KP", deals: 2, value: "$24k", status: "Lead" },
  ];
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="grid grid-cols-12 border-b border-zinc-200 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
        <span className="col-span-5">Customer</span>
        <span className="col-span-2">Owner</span>
        <span className="col-span-2">Deals</span>
        <span className="col-span-3 text-right">Value</span>
      </div>
      <ul>
        {rows.map((r) => (
          <li
            key={r.name}
            className="grid grid-cols-12 items-center border-b border-zinc-200/70 px-3 py-2.5 text-xs last:border-b-0 dark:border-zinc-800/70"
          >
            <span className="col-span-5 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-linear-to-br from-primary/20 to-secondary/20 text-[9px] font-semibold text-primary">
                {r.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {r.name}
              </span>
            </span>
            <span className="col-span-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-100 text-[9px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {r.owner}
              </span>
            </span>
            <span className="col-span-2 tabular-nums text-zinc-700 dark:text-zinc-300">
              {r.deals}
            </span>
            <span className="col-span-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {r.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RolesVisual() {
  const roles: { label: string; tone: string }[] = [
    { label: "Owner", tone: "bg-primary/10 text-primary ring-primary/20" },
    {
      label: "Admin",
      tone: "bg-zinc-900/10 text-zinc-900 ring-zinc-900/15 dark:bg-zinc-100/10 dark:text-zinc-100 dark:ring-zinc-100/15",
    },
    {
      label: "Sales Manager",
      tone: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25",
    },
    {
      label: "Sales Executive",
      tone: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
    },
    {
      label: "Accounts",
      tone: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
    },
    {
      label: "HR",
      tone: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
    },
    {
      label: "Project Manager",
      tone: "bg-indigo-100 text-indigo-700 ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/25",
    },
    {
      label: "Team Member",
      tone: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25",
    },
  ];
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 sm:col-span-2 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Built-in roles
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <span
              key={r.label}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${r.tone}`}
            >
              {r.label}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
          Workspace controls
        </p>
        <ul className="mt-2 space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
          <li className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-500" />
            <Building2 className="h-3 w-3 text-zinc-400" />
            Isolated per workspace
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-500" />
            <Receipt className="h-3 w-3 text-zinc-400" />
            Audit log on every voucher
          </li>
          <li className="flex items-center gap-1.5">
            <Check className="h-3 w-3 text-emerald-500" />
            <Users className="h-3 w-3 text-zinc-400" />
            Granular module access
          </li>
        </ul>
      </div>
    </div>
  );
}
