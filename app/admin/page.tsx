import { Shield } from "lucide-react";
import { auth } from "@/config/auth";

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-white to-secondary/[0.05] dark:from-primary/[0.14] dark:via-zinc-900 dark:to-secondary/[0.10]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-primary/25 to-secondary/15 opacity-40 blur-3xl"
        />
        <div className="relative flex flex-wrap items-start gap-3.5 p-6">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30">
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
            />
            <Shield className="relative h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Platform admin
            </p>
            <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
              Signed in as{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {session?.user?.email}
              </span>
              . Platform-wide tools land here as they come online.
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      <div className="grid place-items-center rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <Shield className="h-8 w-8 text-zinc-400" />
        <p className="mt-3 text-[14px] font-medium text-zinc-700 dark:text-zinc-200">
          Nothing here yet.
        </p>
        <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          This dashboard will host platform-wide tools — workspace list, system
          health, billing, audit log — as each feature is built.
        </p>
      </div>
    </div>
  );
}
