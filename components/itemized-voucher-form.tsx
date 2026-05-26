"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Building2,
  CalendarRange,
  Mail,
  Receipt,
  ScrollText,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/button";
import DatePicker from "@/components/date-picker";
import ItemsEditor, { type ItemRow } from "@/components/items-editor";
import PartyPicker from "@/components/party-picker";
import { cn } from "@/lib/cn";
import {
  VOUCHER_CURRENCIES,
  computeTotals,
  formatCurrency,
  type PartyKind,
  type PartyResult,
  type VoucherCurrency,
} from "@/lib/voucher";

export type VoucherFormState = {
  ok?: true;
  formError?: string;
  errors?: Partial<
    Record<
      | "party"
      | "items"
      | "status"
      | "currency"
      | "primaryDate"
      | "secondaryDate"
      | "discount"
      | "notes",
      string
    >
  >;
};

export type ItemizedVoucherDefaults = {
  party: PartyResult | null;
  currency: VoucherCurrency;
  primaryDate: Date | null;
  secondaryDate: Date | null;
  items: ItemRow[];
  discount: number;
  notes: string;
  status: string;
};

type Props<S extends string> = {
  mode: "create" | "edit";
  workspaceId: string;
  voucherId?: string;
  partyKind: PartyKind;
  partyLabel: string;
  primaryDateLabel: string;
  secondaryDateLabel: string;
  statuses: readonly S[];
  statusLabel: Record<S, string>;
  statusBadgeClass: Record<S, string>;
  defaults: ItemizedVoucherDefaults & { status: S };
  createAction: (
    prev: VoucherFormState,
    formData: FormData,
  ) => Promise<VoucherFormState>;
  updateAction?: (
    prev: VoucherFormState,
    formData: FormData,
  ) => Promise<VoucherFormState>;
  // Optional: extra input rendered inside the schedule section (e.g. vendor
  // bill number for Purchase Invoices). Just plain inputs — wires to FormData.
  extraSchedule?: ReactNode;
  submitLabelCreate: string;
  submitLabelEdit: string;
};

const INITIAL: VoucherFormState = {};
const labelClass = "text-[12px] font-medium text-zinc-700 dark:text-zinc-300";

export default function ItemizedVoucherForm<S extends string>({
  mode,
  workspaceId,
  partyKind,
  partyLabel,
  primaryDateLabel,
  secondaryDateLabel,
  statuses,
  statusLabel,
  statusBadgeClass,
  defaults,
  createAction,
  updateAction,
  extraSchedule,
  submitLabelCreate,
  submitLabelEdit,
}: Props<S>) {
  const router = useRouter();
  const [party, setParty] = useState<PartyResult | null>(defaults.party);
  const [currency, setCurrency] = useState<VoucherCurrency>(defaults.currency);
  const [status, setStatus] = useState<S>(defaults.status);
  const [primaryDate, setPrimaryDate] = useState<Date | null>(
    defaults.primaryDate,
  );
  const [secondaryDate, setSecondaryDate] = useState<Date | null>(
    defaults.secondaryDate,
  );
  const [items, setItems] = useState<ItemRow[]>(defaults.items);
  const [discount, setDiscount] = useState<number>(defaults.discount);
  const [notes, setNotes] = useState(defaults.notes);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [state, formAction, pending] = useActionState(
    (prev: VoucherFormState, formData: FormData) =>
      mode === "create" || !updateAction
        ? createAction(prev, formData)
        : updateAction(prev, formData),
    INITIAL,
  );

  const totals = useMemo(
    () => computeTotals(items, discount),
    [items, discount],
  );

  const errs = state.errors;

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(items)}
          readOnly
        />
        <input type="hidden" name="partyId" value={party?.id ?? ""} readOnly />
        <input
          type="hidden"
          name="partyName"
          value={party?.name ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="partyCompany"
          value={party?.company ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="partyEmail"
          value={party?.email ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="partyGstin"
          value={party?.gstin ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="primaryDate"
          value={primaryDate ? format(primaryDate, "yyyy-MM-dd") : ""}
          readOnly
        />
        <input
          type="hidden"
          name="secondaryDate"
          value={secondaryDate ? format(secondaryDate, "yyyy-MM-dd") : ""}
          readOnly
        />
        <input type="hidden" name="status" value={status} readOnly />
        <input type="hidden" name="currency" value={currency} readOnly />
        <input
          type="hidden"
          name="discount"
          value={String(discount)}
          readOnly
        />
        <input type="hidden" name="notes" value={notes} readOnly />

        <Section
          icon={UserCircle2}
          title={partyLabel}
          subtitle={
            partyKind === "customer"
              ? "Pick a customer from this workspace"
              : "Pick an active vendor"
          }
          accent="from-blue-500 to-indigo-600"
        >
          {party ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-white">
                  <span className="text-[13px] font-semibold">
                    {party.name.charAt(0).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                    {party.name}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                    {party.company ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {party.company}
                      </span>
                    ) : null}
                    {party.company && party.email ? " · " : ""}
                    {party.email ? (
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {party.email}
                      </span>
                    ) : null}
                    {party.gstin ? (
                      <span className="ml-2 rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {party.gstin}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPickerOpen(true)}
              >
                Change
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-4 text-[13px] font-medium text-zinc-600 transition-colors hover:border-primary hover:bg-primary/[0.04] hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              <UserCircle2 className="h-4 w-4" />
              Select {partyKind === "customer" ? "a customer" : "a vendor"}
            </button>
          )}
          {errs?.party ? (
            <p className="mt-2 text-[11.5px] text-red-600 dark:text-red-400">
              {errs.party}
            </p>
          ) : null}
        </Section>

        <Section
          icon={CalendarRange}
          title="Schedule & status"
          subtitle="When the voucher is dated, its expected milestone, and where it stands"
          accent="from-emerald-500 to-teal-600"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>{primaryDateLabel} *</label>
              <div className="mt-2">
                <DatePicker
                  value={primaryDate}
                  onChange={(d) => {
                    setPrimaryDate(d);
                    if (d && secondaryDate && secondaryDate < d)
                      setSecondaryDate(null);
                  }}
                  placeholder={primaryDateLabel}
                  invalid={Boolean(errs?.primaryDate)}
                />
              </div>
              {errs?.primaryDate ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.primaryDate}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>{secondaryDateLabel}</label>
              <div className="mt-2">
                <DatePicker
                  value={secondaryDate}
                  onChange={setSecondaryDate}
                  placeholder={secondaryDateLabel}
                  minDate={primaryDate ?? undefined}
                  invalid={Boolean(errs?.secondaryDate)}
                />
              </div>
              {errs?.secondaryDate ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.secondaryDate}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="mt-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as S)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel[s]}
                    </option>
                  ))}
                </select>
              </div>
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]",
                  statusBadgeClass[status],
                )}
              >
                {statusLabel[status]}
              </p>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <div className="mt-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as VoucherCurrency)}
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {VOUCHER_CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {errs?.currency ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.currency}
                </p>
              ) : null}
            </div>
          </div>
          {extraSchedule ? <div className="mt-3">{extraSchedule}</div> : null}
        </Section>

        <Section
          icon={Receipt}
          title="Line items"
          subtitle="Per-line description, quantity, unit price, and tax %"
          accent="from-indigo-500 to-violet-600"
        >
          <ItemsEditor
            items={items}
            currency={currency}
            onChange={setItems}
            error={errs?.items}
          />
        </Section>

        <Section
          icon={ScrollText}
          title="Notes"
          subtitle="Internal context for this voucher"
          accent="from-amber-500 to-orange-600"
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Internal notes, payment terms, delivery instructions, etc."
            className="w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </Section>

        {state.formError ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {state.formError}
          </p>
        ) : null}

        <div className="sticky bottom-4 z-10 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_18px_38px_-18px_rgba(24,24,27,0.22)] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-[12px]">
              <SummaryRow
                label="Subtotal"
                value={formatCurrency(totals.subtotal, currency)}
              />
              <SummaryRow
                label="Tax"
                value={formatCurrency(totals.taxTotal, currency)}
              />
              <SummaryRow
                label="Discount"
                value={
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(discount)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setDiscount(Number.isFinite(v) && v >= 0 ? v : 0);
                    }}
                    className="w-24 rounded-md border border-zinc-200 bg-white px-2 py-1 text-right text-[13px] text-zinc-900 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                }
              />
              <div className="col-span-3 mt-1 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-800">
                <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                  Total
                </span>
                <span className="text-[20px] font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
                  {formatCurrency(totals.total, currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={pending}
                aria-busy={pending}
              >
                {pending
                  ? mode === "create"
                    ? "Creating…"
                    : "Saving…"
                  : mode === "create"
                    ? submitLabelCreate
                    : submitLabelEdit}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <PartyPicker
        open={pickerOpen}
        workspaceId={workspaceId}
        kind={partyKind}
        onOpenChange={setPickerOpen}
        onSelect={(p) => setParty(p)}
      />
    </>
  );
}

function Section({
  icon: Icon,
  title,
  subtitle,
  accent,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/40 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md bg-gradient-to-br text-white shadow-sm",
            accent,
          )}
        >
          <Icon className="relative h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <>
      <span className="col-span-2 text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <span className="text-right tabular-nums text-zinc-800 dark:text-zinc-200">
        {value}
      </span>
    </>
  );
}
