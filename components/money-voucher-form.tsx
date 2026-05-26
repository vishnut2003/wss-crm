"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Banknote,
  Building2,
  CalendarRange,
  ClipboardList,
  Plus,
  Trash2,
  UserCircle2,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/button";
import DatePicker from "@/components/date-picker";
import Input from "@/components/input";
import PartyPicker from "@/components/party-picker";
import { cn } from "@/lib/cn";
import {
  PAYMENT_MODES,
  PAYMENT_MODE_LABEL,
  VOUCHER_CURRENCIES,
  formatCurrency,
  type PartyKind,
  type PartyResult,
  type PaymentMode,
  type VoucherCurrency,
} from "@/lib/voucher";

export type MoneyVoucherFormState = {
  ok?: true;
  formError?: string;
  errors?: Partial<
    Record<
      | "party"
      | "amount"
      | "paymentMode"
      | "currency"
      | "primaryDate"
      | "status"
      | "reference"
      | "allocations"
      | "notes",
      string
    >
  >;
};

export type OpenInvoice = {
  id: string;
  number: string;
  total: number;
  balance: number;
  currency: string;
  primaryDateISO: string;
};

export type AllocationRow = {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  balance: number; // outstanding at the time of picking
  currency: string;
};

export type MoneyVoucherDefaults<S extends string> = {
  party: PartyResult | null;
  currency: VoucherCurrency;
  primaryDate: Date | null;
  amount: number;
  paymentMode: PaymentMode;
  reference: string;
  notes: string;
  status: S;
  allocations: AllocationRow[];
};

type Props<S extends string> = {
  mode: "create" | "edit";
  workspaceId: string;
  voucherId?: string;
  partyKind: PartyKind;
  partyLabel: string;
  primaryDateLabel: string;
  amountLabel: string;
  statuses: readonly S[];
  statusLabel: Record<S, string>;
  statusBadgeClass: Record<S, string>;
  defaults: MoneyVoucherDefaults<S>;
  openInvoicesByParty: (partyId: string) => Promise<
    { ok: true; results: OpenInvoice[] } | { ok: false; error: string }
  >;
  createAction: (
    prev: MoneyVoucherFormState,
    formData: FormData,
  ) => Promise<MoneyVoucherFormState>;
  updateAction?: (
    prev: MoneyVoucherFormState,
    formData: FormData,
  ) => Promise<MoneyVoucherFormState>;
  submitLabelCreate: string;
  submitLabelEdit: string;
};

const INITIAL: MoneyVoucherFormState = {};
const labelClass = "text-[12px] font-medium text-zinc-700 dark:text-zinc-300";

export default function MoneyVoucherForm<S extends string>({
  mode,
  workspaceId,
  partyKind,
  partyLabel,
  primaryDateLabel,
  amountLabel,
  statuses,
  statusLabel,
  statusBadgeClass,
  defaults,
  openInvoicesByParty,
  createAction,
  updateAction,
  submitLabelCreate,
  submitLabelEdit,
}: Props<S>) {
  const router = useRouter();
  const [party, setParty] = useState<PartyResult | null>(defaults.party);
  const [currency, setCurrency] = useState<VoucherCurrency>(defaults.currency);
  const [status, setStatus] = useState<S>(defaults.status);
  const [primaryDate, setPrimaryDate] = useState<Date | null>(defaults.primaryDate);
  const [amount, setAmount] = useState<number>(defaults.amount);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(defaults.paymentMode);
  const [reference, setReference] = useState(defaults.reference);
  const [notes, setNotes] = useState(defaults.notes);
  const [allocations, setAllocations] = useState<AllocationRow[]>(
    defaults.allocations,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [allocPickerOpen, setAllocPickerOpen] = useState(false);

  const allocatedTotal = useMemo(
    () => allocations.reduce((s, a) => s + (a.amount || 0), 0),
    [allocations],
  );
  const unallocated = Math.max(0, amount - allocatedTotal);

  const [state, formAction, pending] = useActionState(
    (prev: MoneyVoucherFormState, formData: FormData) =>
      mode === "create" || !updateAction
        ? createAction(prev, formData)
        : updateAction(prev, formData),
    INITIAL,
  );

  const errs = state.errors;

  async function loadOpenInvoices() {
    if (!party) return;
    setLoadingInvoices(true);
    const res = await openInvoicesByParty(party.id);
    setLoadingInvoices(false);
    if (res.ok) setOpenInvoices(res.results);
    setAllocPickerOpen(true);
  }

  function addAllocation(inv: OpenInvoice) {
    if (allocations.some((a) => a.invoiceId === inv.id)) return;
    const next = Math.min(inv.balance, Math.max(0, amount - allocatedTotal));
    setAllocations([
      ...allocations,
      {
        invoiceId: inv.id,
        invoiceNumber: inv.number,
        balance: inv.balance,
        currency: inv.currency,
        amount: next,
      },
    ]);
  }

  function updateAllocAmount(idx: number, value: number) {
    setAllocations((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, amount: Math.max(0, value) } : a)),
    );
  }

  function removeAllocation(idx: number) {
    setAllocations((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input type="hidden" name="partyId" value={party?.id ?? ""} readOnly />
        <input type="hidden" name="partyName" value={party?.name ?? ""} readOnly />
        <input type="hidden" name="partyCompany" value={party?.company ?? ""} readOnly />
        <input type="hidden" name="partyEmail" value={party?.email ?? ""} readOnly />
        <input type="hidden" name="partyGstin" value={party?.gstin ?? ""} readOnly />
        <input
          type="hidden"
          name="primaryDate"
          value={primaryDate ? format(primaryDate, "yyyy-MM-dd") : ""}
          readOnly
        />
        <input type="hidden" name="status" value={status} readOnly />
        <input type="hidden" name="currency" value={currency} readOnly />
        <input type="hidden" name="amount" value={String(amount)} readOnly />
        <input type="hidden" name="paymentMode" value={paymentMode} readOnly />
        <input type="hidden" name="reference" value={reference} readOnly />
        <input type="hidden" name="notes" value={notes} readOnly />
        <input
          type="hidden"
          name="allocations"
          value={JSON.stringify(
            allocations.map((a) => ({
              invoiceId: a.invoiceId,
              invoiceNumber: a.invoiceNumber,
              amount: a.amount,
            })),
          )}
          readOnly
        />

        <Section
          icon={UserCircle2}
          title={partyLabel}
          subtitle={
            partyKind === "customer"
              ? "Who paid you"
              : "Who you paid"
          }
          accent="from-blue-500 to-indigo-600"
        >
          {party ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-[13px] font-semibold text-white">
                  {party.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                    {party.name}
                  </p>
                  {party.company ? (
                    <p className="mt-0.5 inline-flex items-center gap-1 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                      <Building2 className="h-3 w-3" />
                      {party.company}
                    </p>
                  ) : null}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setParty(null);
                  setAllocations([]);
                  setPickerOpen(true);
                }}
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
          icon={Banknote}
          title="Payment details"
          subtitle="Amount, mode, and reference"
          accent="from-emerald-500 to-teal-600"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>{primaryDateLabel} *</label>
              <div className="mt-2">
                <DatePicker
                  value={primaryDate}
                  onChange={setPrimaryDate}
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
              <label className={labelClass}>{amountLabel} *</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={String(amount)}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setAmount(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                className="mt-2 tabular-nums"
              />
              {errs?.amount ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.amount}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Mode</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_MODE_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as VoucherCurrency)}
                className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {VOUCHER_CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Reference</label>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                maxLength={120}
                placeholder="Cheque no, UTR, txn id, etc."
                className="mt-2"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as S)}
                className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px]",
                  statusBadgeClass[status],
                )}
              >
                {statusLabel[status]}
              </p>
            </div>
          </div>
        </Section>

        <Section
          icon={ClipboardList}
          title="Against invoices (optional)"
          subtitle={
            partyKind === "customer"
              ? "Allocate this receipt to one or more open invoices. Leave empty for an on-account receipt."
              : "Allocate this payment to one or more vendor bills. Leave empty for an on-account payment."
          }
          accent="from-violet-500 to-purple-600"
        >
          {allocations.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
              <div className="hidden bg-zinc-50 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[1fr_120px_120px_36px] sm:gap-2 dark:bg-zinc-900/60 dark:text-zinc-400">
                <span>Invoice</span>
                <span className="text-right">Balance</span>
                <span className="text-right">Allocate</span>
                <span></span>
              </div>
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {allocations.map((a, idx) => (
                  <li
                    key={a.invoiceId}
                    className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_120px_120px_36px] sm:items-center"
                  >
                    <span className="font-mono text-[12.5px] text-zinc-700 dark:text-zinc-300">
                      {a.invoiceNumber}
                    </span>
                    <span className="text-right text-[12px] tabular-nums text-zinc-500 dark:text-zinc-400">
                      {formatCurrency(a.balance, a.currency)}
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={String(a.amount)}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        updateAllocAmount(idx, Number.isFinite(v) ? v : 0);
                      }}
                      className="sm:text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeAllocation(idx)}
                      aria-label="Remove allocation"
                      className="grid h-8 w-8 place-items-center justify-self-end rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              No invoices allocated. This will be recorded on account.
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!party}
              onClick={() => {
                if (!party) return;
                if (openInvoices.length === 0) loadOpenInvoices();
                else setAllocPickerOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              {loadingInvoices ? "Loading…" : "Pick invoice"}
            </Button>
            <p className="text-[11.5px] text-zinc-500 dark:text-zinc-400">
              Allocated{" "}
              <span className="font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                {formatCurrency(allocatedTotal, currency)}
              </span>{" "}
              of {formatCurrency(amount, currency)}
              {unallocated > 0 ? (
                <>
                  {" "}
                  · On account{" "}
                  <span className="text-amber-600 dark:text-amber-400">
                    {formatCurrency(unallocated, currency)}
                  </span>
                </>
              ) : null}
            </p>
          </div>
          {errs?.allocations ? (
            <p className="mt-2 text-[11.5px] text-red-600 dark:text-red-400">
              {errs.allocations}
            </p>
          ) : null}
        </Section>

        <Section
          icon={CalendarRange}
          title="Notes"
          subtitle="Internal context for this transaction"
          accent="from-amber-500 to-orange-600"
        >
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Bank, branch, narration, internal memo, etc."
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

        <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_18px_38px_-18px_rgba(24,24,27,0.22)] dark:border-zinc-800 dark:bg-zinc-900">
          <div>
            <p className="text-[10.5px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {amountLabel}
            </p>
            <p className="text-[22px] font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(amount, currency)}
            </p>
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
                  ? "Recording…"
                  : "Saving…"
                : mode === "create"
                  ? submitLabelCreate
                  : submitLabelEdit}
            </Button>
          </div>
        </div>
      </form>

      <PartyPicker
        open={pickerOpen}
        workspaceId={workspaceId}
        kind={partyKind}
        onOpenChange={setPickerOpen}
        onSelect={(p) => {
          setParty(p);
          setOpenInvoices([]);
          setAllocations([]);
        }}
      />

      <InvoiceAllocPicker
        open={allocPickerOpen}
        invoices={openInvoices.filter(
          (i) => !allocations.some((a) => a.invoiceId === i.id),
        )}
        onOpenChange={setAllocPickerOpen}
        onSelect={(inv) => {
          addAllocation(inv);
          setAllocPickerOpen(false);
        }}
        onReload={loadOpenInvoices}
        loading={loadingInvoices}
      />
    </>
  );
}

function InvoiceAllocPicker({
  open,
  invoices,
  onOpenChange,
  onSelect,
  onReload,
  loading,
}: {
  open: boolean;
  invoices: OpenInvoice[];
  onOpenChange: (v: boolean) => void;
  onSelect: (inv: OpenInvoice) => void;
  onReload: () => void;
  loading: boolean;
}) {
  // Lightweight inline popup. Uses the same Popup wrapper.
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={() => onOpenChange(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">
            Pick an open invoice
          </h3>
          <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
            Showing open or partially-paid invoices for this party.
          </p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-6 py-8 text-center text-[13px] text-zinc-500">
              Loading invoices…
            </p>
          ) : invoices.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                No open invoices for this party.
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onReload}
                className="mt-3"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(inv)}
                    className="flex w-full items-center justify-between gap-3 px-6 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[12.5px] text-zinc-700 dark:text-zinc-300">
                        {inv.number}
                      </p>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Total {formatCurrency(inv.total, inv.currency)}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-white">
                      {formatCurrency(inv.balance, inv.currency)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center justify-end border-t border-zinc-100 px-6 py-3 dark:border-zinc-800">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </div>
    </div>
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
