"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import Input from "@/components/input";
import { cn } from "@/lib/cn";
import { timeAgo } from "@/lib/time";
import UserDisableToggle from "./user-disable-toggle";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  providers: string[];
  emailVerified: boolean;
  disabled: boolean;
  workspaceCount: number;
  createdAt: string;
  isSelf: boolean;
  isPlatformAdmin: boolean;
};

export default function UsersList({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [query, users]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="h-10 pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {filtered.length === 0 ? (
          <div className="grid place-items-center p-12 text-center text-[13px] text-zinc-500 dark:text-zinc-400">
            No users match &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3.5 px-4 py-3.5 sm:px-5"
              >
                {u.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={u.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-10 w-10 shrink-0 rounded-full ring-1 ring-zinc-200 dark:ring-white/10"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-[14px] font-semibold text-white">
                    {(u.name || u.email).charAt(0).toUpperCase()}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "truncate text-[14px] font-semibold",
                        u.disabled
                          ? "text-zinc-400 line-through dark:text-zinc-500"
                          : "text-zinc-900 dark:text-zinc-100",
                      )}
                    >
                      {u.name}
                    </p>
                    {u.isPlatformAdmin ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/15 dark:ring-primary/25">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                    {u.email}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {u.providers.map((p) => (
                      <span
                        key={p}
                        className="rounded px-1.5 py-0.5 font-medium uppercase tracking-wider text-zinc-500 ring-1 ring-inset ring-zinc-200 dark:text-zinc-400 dark:ring-zinc-700"
                      >
                        {p}
                      </span>
                    ))}
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-medium uppercase tracking-wider ring-1 ring-inset",
                        u.emailVerified
                          ? "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25"
                          : "text-zinc-400 ring-zinc-200 dark:text-zinc-500 dark:ring-zinc-700",
                      )}
                    >
                      {u.emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>

                <div className="hidden text-right text-[12px] text-zinc-500 sm:block dark:text-zinc-400">
                  <p className="tabular-nums">
                    {u.workspaceCount}{" "}
                    {u.workspaceCount === 1 ? "workspace" : "workspaces"}
                  </p>
                  <p className="mt-0.5">Joined {timeAgo(u.createdAt)}</p>
                </div>

                <UserDisableToggle
                  userId={u.id}
                  disabled={u.disabled}
                  locked={u.isSelf || u.isPlatformAdmin}
                  lockedReason={
                    u.isSelf
                      ? "You can't disable your own account."
                      : "Platform admins can't be disabled here."
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
