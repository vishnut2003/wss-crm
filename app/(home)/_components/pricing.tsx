import Link from "next/link";
import Eyebrow from "@/components/eyebrow";
import { buttonClasses } from "@/components/button";
import { ArrowRight, Check, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  unit: string;
  billing: string;
  description: string;
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
};

// Every plan unlocks the entire platform — billing cadence is the only
// difference. Keep this list in sync with the workspace modules.
const features: string[] = [
  "Customers & CRM with full activity history",
  "Leads & drag-and-drop pipeline",
  "AI Proposals & Quotations with PDF export",
  "Projects, tasks, milestones & calendar",
  "Sales orders, invoices, receipts & payments",
  "Purchase orders, invoices & vendors",
  "Payment recovery tracking",
  "HR & employee management",
  "8 built-in roles with granular access",
  "Multiple isolated workspaces",
  "Audit log on every voucher",
  "Priority support",
];

const plans: Plan[] = [
  {
    name: "Annual",
    price: "₹200",
    unit: "/ user / month",
    billing: "Billed annually (₹2,400 per user / year)",
    description: "Complete access to every feature — at our best price.",
    cta: { label: "Get started", href: "/signup" },
    badge: "Save 33%",
    highlighted: true,
  },
  {
    name: "Monthly",
    price: "₹300",
    unit: "/ user / month",
    billing: "Billed monthly — cancel anytime",
    description: "Complete access to every feature, with no commitment.",
    cta: { label: "Get started", href: "/signup" },
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden border-b border-zinc-200 py-24 dark:border-zinc-800"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(142,81,255,0.10),transparent_70%)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(142,81,255,0.16),transparent_70%)]"
      />

      <div className="mx-auto w-full max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            One price. Every feature.
          </h2>
          <p className="mt-4 text-balance text-zinc-600 dark:text-zinc-400">
            No tiers, no locked modules. Both plans include the entire platform
            for every user &mdash; pay monthly, or save 33% with annual billing.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-7 dark:bg-zinc-900 ${
                p.highlighted
                  ? "border-primary/40 shadow-xl shadow-primary/10 dark:border-primary/50"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {p.highlighted ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-px -z-10 rounded-2xl bg-linear-to-br from-primary/30 via-transparent to-secondary/30 opacity-60 blur"
                />
              ) : null}

              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.name}
                </h3>
                {p.badge ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-linear-to-r from-primary to-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Sparkles className="h-2.5 w-2.5" />
                    {p.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-4 flex items-end gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                  {p.price}
                </span>
                <span className="pb-1 text-xs text-zinc-500 dark:text-zinc-500">
                  {p.unit}
                </span>
              </p>

              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                {p.billing}
              </p>

              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {p.description}
              </p>

              <Link
                href={p.cta.href}
                className={buttonClasses({
                  variant: p.highlighted ? "primary" : "secondary",
                  size: "sm",
                  className: "mt-6 w-full",
                })}
              >
                {p.cta.label}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <p className="mt-7 border-t border-zinc-200 pt-6 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
                Everything included
              </p>
              <ul className="mt-4 space-y-3">
                {features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-zinc-500 dark:text-zinc-500">
          Prices in INR (₹), per user, per month, exclusive of taxes. Cancel
          anytime.
        </p>
      </div>
    </section>
  );
}
