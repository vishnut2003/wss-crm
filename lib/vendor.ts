export const VENDOR_STATUSES = ["active", "inactive"] as const;
export type VendorStatus = (typeof VENDOR_STATUSES)[number];

export const VENDOR_STATUS_LABEL: Record<VendorStatus, string> = {
  active: "Active",
  inactive: "Inactive",
};

export const VENDOR_STATUS_BADGE_CLASS: Record<VendorStatus, string> = {
  active:
    "bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/25",
  inactive:
    "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200 dark:bg-zinc-500/15 dark:text-zinc-300 dark:ring-zinc-500/25",
};

export const VENDOR_STATUS_DOT_CLASS: Record<VendorStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-zinc-400 dark:bg-zinc-500",
};
