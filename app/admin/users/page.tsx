import { Users } from "lucide-react";
import { connectDB } from "@/config/db";
import User from "@/models/user";
import Workspace from "@/models/workspace";
import { isPlatformAdminEmail, requirePlatformAdmin } from "@/lib/platform-admin";
import UsersList, { type UserRow } from "./_components/users-list";

async function getUsers(currentUserId: string): Promise<UserRow[]> {
  await connectDB();

  const [users, workspaces] = await Promise.all([
    User.find({}).sort({ createdAt: -1 }).lean(),
    Workspace.find({}, "owner members.user").lean(),
  ]);

  // One pass over workspaces → count distinct workspaces each user belongs to.
  const counts = new Map<string, number>();
  for (const w of workspaces) {
    const ids = new Set<string>();
    if (w.owner) ids.add(String(w.owner));
    for (const m of w.members ?? []) {
      if (m?.user) ids.add(String(m.user));
    }
    for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return users.map((u) => {
    const id = String(u._id);
    return {
      id,
      name: u.name ?? "",
      email: u.email,
      image: u.image ?? null,
      providers: u.providers ?? [],
      emailVerified: Boolean(u.emailVerified),
      disabled: Boolean(u.disabled),
      workspaceCount: counts.get(id) ?? 0,
      createdAt: (u.createdAt as Date).toISOString(),
      isSelf: id === currentUserId,
      isPlatformAdmin: isPlatformAdminEmail(u.email),
    };
  });
}

export default async function AdminUsersPage() {
  const { session } = await requirePlatformAdmin();
  const users = await getUsers(session.user.id);
  const disabledCount = users.filter((u) => u.disabled).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30">
          <Users className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            Platform admin
          </p>
          <h1 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
            Users
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            {users.length} total
            {disabledCount > 0 ? (
              <>
                {" · "}
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {disabledCount} disabled
                </span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <UsersList users={users} />

      <p className="px-1 text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
        Disabling an account blocks all new sign-ins (password and Google). An
        already signed-in user keeps their session until it expires.
      </p>
    </div>
  );
}
