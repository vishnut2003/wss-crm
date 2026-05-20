export const USER_ROLES = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
  "accounts",
  "hr",
  "project_manager",
  "team_member",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const AUTH_PROVIDERS = ["credentials", "google"] as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[number];

// Roles an actor is allowed to assign when adding or editing another
// employee. "owner" is never assignable from these flows.
export function assignableRolesFor(actorRole: UserRole): UserRole[] {
  const nonOwnerRoles = USER_ROLES.filter((r) => r !== "owner");
  if (actorRole === "owner") return nonOwnerRoles;
  if (actorRole === "admin" || actorRole === "hr")
    return nonOwnerRoles.filter((r) => r !== "admin");
  return [];
}

export const EMPLOYEE_MANAGER_ROLES: UserRole[] = ["owner", "admin", "hr"];

export function canManageEmployees(role: UserRole): boolean {
  return EMPLOYEE_MANAGER_ROLES.includes(role);
}

export const ROLE_LABEL: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_executive: "Sales Executive",
  accounts: "Accounts",
  hr: "HR",
  project_manager: "Project Manager",
  team_member: "Team Member",
};

export const ROLE_BADGE_CLASS: Record<UserRole, string> = {
  owner:
    "bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/15 dark:ring-primary/25",
  admin:
    "bg-zinc-900/10 text-zinc-900 ring-1 ring-inset ring-zinc-900/15 dark:bg-zinc-100/10 dark:text-zinc-100 dark:ring-zinc-100/15",
  sales_manager:
    "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-500/25",
  sales_executive:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  accounts:
    "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
  hr: "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
  project_manager:
    "bg-indigo-100 text-indigo-700 ring-1 ring-inset ring-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:ring-indigo-500/25",
  team_member:
    "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/25",
};
