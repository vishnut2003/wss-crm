import type { UserRole } from "@/lib/user";

// Only the workspace owner and admins can view or edit the company profile.
// It feeds seller details onto quotations, invoices and other documents.
export const COMPANY_MANAGER_ROLES: UserRole[] = ["owner", "admin"];

export function canManageCompany(role: UserRole): boolean {
  return COMPANY_MANAGER_ROLES.includes(role);
}
