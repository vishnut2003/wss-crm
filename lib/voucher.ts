import type { UserRole } from "@/lib/user";

// Shared types and math used by all Tally-style vouchers (Sales/Purchase
// Order, Sales/Purchase Invoice, Receipt, Payment). Kept deliberately small
// — number generation lives in each voucher's actions.ts, since the prefix
// and Model differ per type.

export const VOUCHER_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "AUD",
  "CAD",
  "SGD",
] as const;
export type VoucherCurrency = (typeof VOUCHER_CURRENCIES)[number];

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

export type VoucherItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
};

export type VoucherTotals = {
  subtotal: number;
  taxTotal: number;
  total: number;
};

function roundCurrency(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function lineSubtotal(item: VoucherItemInput): number {
  return roundCurrency(item.quantity * item.unitPrice);
}

export function lineTax(item: VoucherItemInput): number {
  return roundCurrency((item.quantity * item.unitPrice * item.taxRate) / 100);
}

export function computeTotals(
  items: VoucherItemInput[],
  discount: number,
): VoucherTotals {
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

// Party = the other side of the voucher. Customer for sales-side vouchers,
// Vendor for purchase-side. Snapshotted onto the voucher so historical
// documents stay readable even if the master record is later edited.
export const PARTY_KINDS = ["customer", "vendor"] as const;
export type PartyKind = (typeof PARTY_KINDS)[number];

export type PartyResult = {
  kind: PartyKind;
  id: string;
  name: string;
  company: string;
  email: string;
  gstin: string;
};

// Payment modes — kept small on purpose. Tally's wider list (NEFT, RTGS, IMPS,
// demand draft, etc.) isn't worth the extra UI for a basic implementation.
export const PAYMENT_MODES = [
  "cash",
  "bank",
  "cheque",
  "upi",
  "other",
] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const PAYMENT_MODE_LABEL: Record<PaymentMode, string> = {
  cash: "Cash",
  bank: "Bank transfer",
  cheque: "Cheque",
  upi: "UPI",
  other: "Other",
};

// Status sets — one per voucher type. Each voucher's lib re-exports its own.
export const SALES_ORDER_STATUSES = [
  "draft",
  "confirmed",
  "invoiced",
  "cancelled",
] as const;
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];

export const SALES_INVOICE_STATUSES = [
  "unpaid",
  "partial",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type SalesInvoiceStatus = (typeof SALES_INVOICE_STATUSES)[number];

export const RECEIPT_STATUSES = [
  "cleared",
  "bounced",
  "cancelled",
] as const;
export type ReceiptStatus = (typeof RECEIPT_STATUSES)[number];

export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "confirmed",
  "invoiced",
  "cancelled",
] as const;
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];

export const PURCHASE_INVOICE_STATUSES = [
  "unpaid",
  "partial",
  "paid",
  "overdue",
  "cancelled",
] as const;
export type PurchaseInvoiceStatus = (typeof PURCHASE_INVOICE_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "cleared",
  "bounced",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

// Status visual maps — re-used across list pages and forms.
export const SALES_ORDER_STATUS_LABEL: Record<SalesOrderStatus, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  invoiced: "Invoiced",
  cancelled: "Cancelled",
};

export const SALES_INVOICE_STATUS_LABEL: Record<SalesInvoiceStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const RECEIPT_STATUS_LABEL: Record<ReceiptStatus, string> = {
  cleared: "Cleared",
  bounced: "Bounced",
  cancelled: "Cancelled",
};

export const PURCHASE_ORDER_STATUS_LABEL: Record<PurchaseOrderStatus, string> =
  {
    draft: "Draft",
    confirmed: "Confirmed",
    invoiced: "Invoiced",
    cancelled: "Cancelled",
  };

export const PURCHASE_INVOICE_STATUS_LABEL: Record<
  PurchaseInvoiceStatus,
  string
> = {
  unpaid: "Unpaid",
  partial: "Partially paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  cleared: "Cleared",
  bounced: "Bounced",
  cancelled: "Cancelled",
};

const BADGE_DRAFT =
  "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/25";
const BADGE_BLUE =
  "bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/25";
const BADGE_AMBER =
  "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/25";
const BADGE_GREEN =
  "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25";
const BADGE_ROSE =
  "bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/25";
const BADGE_VIOLET =
  "bg-violet-100 text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/25";

export const SALES_ORDER_STATUS_BADGE_CLASS: Record<SalesOrderStatus, string> =
  {
    draft: BADGE_DRAFT,
    confirmed: BADGE_BLUE,
    invoiced: BADGE_GREEN,
    cancelled: BADGE_ROSE,
  };

export const SALES_INVOICE_STATUS_BADGE_CLASS: Record<
  SalesInvoiceStatus,
  string
> = {
  unpaid: BADGE_DRAFT,
  partial: BADGE_AMBER,
  paid: BADGE_GREEN,
  overdue: BADGE_ROSE,
  cancelled: BADGE_VIOLET,
};

export const RECEIPT_STATUS_BADGE_CLASS: Record<ReceiptStatus, string> = {
  cleared: BADGE_GREEN,
  bounced: BADGE_ROSE,
  cancelled: BADGE_VIOLET,
};

export const PURCHASE_ORDER_STATUS_BADGE_CLASS: Record<
  PurchaseOrderStatus,
  string
> = SALES_ORDER_STATUS_BADGE_CLASS;

export const PURCHASE_INVOICE_STATUS_BADGE_CLASS: Record<
  PurchaseInvoiceStatus,
  string
> = SALES_INVOICE_STATUS_BADGE_CLASS;

export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> =
  RECEIPT_STATUS_BADGE_CLASS;

// Role gates — accounts module is hard-walled. Read separately from
// canManageVoucher so a sales_executive can view but only edit their own.
export const VOUCHER_VIEWER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
  "accounts",
];

export const VOUCHER_MANAGER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "sales_manager",
  "accounts",
];

// Purchase-side is gated tighter — sales_executive has no business touching
// vendor money. Owner / admin / accounts only.
export const PURCHASE_VIEWER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "accounts",
];

export const PURCHASE_MANAGER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "accounts",
];

export const VENDOR_VIEWER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "accounts",
  "sales_manager",
];

export const VENDOR_MANAGER_ROLES: UserRole[] = [
  "owner",
  "admin",
  "accounts",
];

export function canViewVouchers(role: UserRole): boolean {
  return VOUCHER_VIEWER_ROLES.includes(role);
}

export function canManageAnyVoucher(role: UserRole): boolean {
  return VOUCHER_MANAGER_ROLES.includes(role);
}

// Sales executives are scoped to vouchers they created or were assigned.
export function canViewAllVouchers(role: UserRole): boolean {
  return role !== "sales_executive";
}

export function canManageVoucher(
  role: UserRole,
  userId: string,
  ownerIds: { createdBy: string; assignedTo: string | null },
): boolean {
  if (canManageAnyVoucher(role)) return true;
  if (role !== "sales_executive") return false;
  if (ownerIds.createdBy === userId) return true;
  if (ownerIds.assignedTo === userId) return true;
  return false;
}

export function canViewPurchases(role: UserRole): boolean {
  return PURCHASE_VIEWER_ROLES.includes(role);
}

export function canManagePurchases(role: UserRole): boolean {
  return PURCHASE_MANAGER_ROLES.includes(role);
}

export function canViewVendors(role: UserRole): boolean {
  return VENDOR_VIEWER_ROLES.includes(role);
}

export function canManageVendors(role: UserRole): boolean {
  return VENDOR_MANAGER_ROLES.includes(role);
}

// Parse a generic, fault-tolerant items[] payload posted from the form as
// JSON. Mirrors the quotation pattern at quotations/actions.ts:80-101.
export function parseVoucherItems(raw: string): VoucherItemInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.map((row) => {
      const r = row as Record<string, unknown>;
      const desc = String(r.description ?? "").trim();
      const qty = Number(r.quantity ?? 0);
      const price = Number(r.unitPrice ?? 0);
      const tax = Number(r.taxRate ?? 0);
      return {
        description: desc,
        quantity: Number.isFinite(qty) && qty >= 0 ? qty : 0,
        unitPrice: Number.isFinite(price) && price >= 0 ? price : 0,
        taxRate:
          Number.isFinite(tax) && tax >= 0 && tax <= 100 ? tax : 0,
      };
    });
  } catch {
    return null;
  }
}

export type AllocationInput = {
  invoiceId: string;
  amount: number;
};

// Allocations are an optional [{ invoiceId, amount }] list on Receipts and
// Payments. Total must not exceed the receipt/payment amount — that's checked
// in the action where we know the parent total.
export function parseAllocations(raw: string): AllocationInput[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((row) => {
        const r = row as Record<string, unknown>;
        const invoiceId = String(r.invoiceId ?? "").trim();
        const amount = Number(r.amount ?? 0);
        return {
          invoiceId,
          amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
        };
      })
      .filter((a) => a.invoiceId && a.amount > 0);
  } catch {
    return null;
  }
}

export function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Format used everywhere: PREFIX-YYYY-NNNN. Caller picks the prefix.
export function formatVoucherNumber(
  prefix: string,
  year: number,
  seq: number,
): string {
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}
