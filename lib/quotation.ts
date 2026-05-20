import type { UserRole } from "@/lib/user";

export const QUOTATION_STATUSES = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

export const QUOTATION_STATUS_BADGE_CLASS: Record<QuotationStatus, string> = {
  draft:
    "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/25",
  sent:
    "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/25",
  accepted:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  rejected:
    "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25",
  expired:
    "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25",
};

export const QUOTATION_STATUS_DOT_CLASS: Record<QuotationStatus, string> = {
  draft: "bg-zinc-400 dark:bg-zinc-500",
  sent: "bg-sky-500",
  accepted: "bg-emerald-500",
  rejected: "bg-rose-500",
  expired: "bg-amber-500",
};

export const QUOTATION_RECIPIENT_KINDS = [
  "customer",
  "lead",
  "custom",
] as const;
export type QuotationRecipientKind = (typeof QUOTATION_RECIPIENT_KINDS)[number];

export const QUOTATION_VIEWER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
];

export const QUOTATION_MANAGER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "sales_manager",
];

export function canViewQuotations(role: UserRole): boolean {
  return QUOTATION_VIEWER_ROLES.includes(role);
}

// Sales executives are scoped to quotations they created or are assigned to.
export function canViewAllQuotations(role: UserRole): boolean {
  return role !== "sales_executive";
}

export function canManageAnyQuotation(role: UserRole): boolean {
  return QUOTATION_MANAGER_ROLES.includes(role);
}

export function canManageQuotation(
  role: UserRole,
  userId: string,
  ownerIds: { createdBy: string; assignedTo: string | null },
): boolean {
  if (canManageAnyQuotation(role)) return true;
  if (role !== "sales_executive") return false;
  if (ownerIds.createdBy === userId) return true;
  if (ownerIds.assignedTo === userId) return true;
  return false;
}

// Shared item math so client and server stay in lockstep.
export type QuotationItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type QuotationTotals = {
  subtotal: number;
  taxTotal: number;
  total: number;
};

export function lineSubtotal(item: QuotationItemInput): number {
  return roundCurrency(item.quantity * item.unitPrice);
}

export function lineTax(item: QuotationItemInput): number {
  return roundCurrency((item.quantity * item.unitPrice * item.taxRate) / 100);
}

export function computeTotals(
  items: QuotationItemInput[],
  discount: number,
): QuotationTotals {
  let subtotal = 0;
  let taxTotal = 0;
  for (const it of items) {
    subtotal += lineSubtotal(it);
    taxTotal += lineTax(it);
  }
  subtotal = roundCurrency(subtotal);
  taxTotal = roundCurrency(taxTotal);
  const total = roundCurrency(Math.max(0, subtotal + taxTotal - discount));
  return { subtotal, taxTotal, total };
}

function roundCurrency(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export const QUOTATION_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "AUD",
  "CAD",
  "SGD",
] as const;
export type QuotationCurrency = (typeof QUOTATION_CURRENCIES)[number];

const CURRENCY_SYMBOL: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

export function formatCurrency(value: number, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value < 0 ? "-" : ""}${symbol}${formatted}`;
}
