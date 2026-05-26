import Link from "next/link";
import { Building2, CalendarRange, Pencil } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatCurrency } from "@/lib/voucher";
import Button from "@/components/button";

export type VoucherCardData = {
  id: string;
  number: string;
  partyName: string;
  partyCompany: string;
  primaryDate: string;
  secondaryDate?: string | null;
  primaryDateLabel: string;
  secondaryDateLabel?: string;
  currency: string;
  total: number;
  itemCount?: number;
  status: string;
  statusLabel: string;
  statusBadgeClass: string;
  amountPaid?: number;
};

type Props = {
  voucher: VoucherCardData;
  editHref: string;
  canEdit: boolean;
  // Optional: action slot for extras (e.g. download, mark followed-up).
  extra?: React.ReactNode;
  // Optional: render a tiny line under the totals (e.g. "Paid ₹2,000 of ₹10,000")
  hint?: React.ReactNode;
};

export default function VoucherCard({
  voucher,
  editHref,
  canEdit,
  extra,
  hint,
}: Props) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-tight text-zinc-500 dark:text-zinc-400">
            {voucher.number}
          </p>
          <p className="mt-0.5 truncate text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">
            {voucher.partyName}
          </p>
          {voucher.partyCompany ? (
            <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[11.5px] text-zinc-500 dark:text-zinc-400">
              <Building2 className="h-3 w-3" />
              {voucher.partyCompany}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
            voucher.statusBadgeClass,
          )}
        >
          {voucher.statusLabel}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-400">
        <dt className="inline-flex items-center gap-1">
          <CalendarRange className="h-3 w-3" />
          {voucher.primaryDateLabel}
        </dt>
        <dd className="text-right text-zinc-700 dark:text-zinc-300">
          {voucher.primaryDate}
        </dd>
        {voucher.secondaryDate ? (
          <>
            <dt className="inline-flex items-center gap-1">
              <CalendarRange className="h-3 w-3" />
              {voucher.secondaryDateLabel}
            </dt>
            <dd className="text-right text-zinc-700 dark:text-zinc-300">
              {voucher.secondaryDate}
            </dd>
          </>
        ) : null}
        {voucher.itemCount !== undefined ? (
          <>
            <dt>Items</dt>
            <dd className="text-right text-zinc-700 dark:text-zinc-300">
              {voucher.itemCount}
            </dd>
          </>
        ) : null}
      </dl>

      <div className="mt-3 flex items-end justify-between gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div>
          <p className="text-[10.5px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Total
          </p>
          <p className="text-[18px] font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
            {formatCurrency(voucher.total, voucher.currency)}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          {extra}
          {canEdit ? (
            <Link href={editHref}>
              <Button type="button" variant="secondary" size="sm">
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
