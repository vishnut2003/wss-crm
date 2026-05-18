export const USER_ROLES = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
  "accounts",
  "hr",
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
