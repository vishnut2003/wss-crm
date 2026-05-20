"use client";

import {
  useActionState,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Building2,
  CalendarRange,
  Plus,
  Receipt,
  ScrollText,
  Sparkles,
  Trash2,
  UserCircle2,
  UserPlus,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import Button from "@/components/button";
import Combobox, { type ComboboxOption } from "@/components/combobox";
import DatePicker from "@/components/date-picker";
import Input from "@/components/input";
import { cn } from "@/lib/cn";
import {
  QUOTATION_CURRENCIES,
  QUOTATION_STATUSES,
  QUOTATION_STATUS_BADGE_CLASS,
  QUOTATION_STATUS_DOT_CLASS,
  QUOTATION_STATUS_LABEL,
  computeTotals,
  formatCurrency,
  lineSubtotal,
  type QuotationCurrency,
  type QuotationStatus,
} from "@/lib/quotation";
import {
  createQuotation,
  updateQuotation,
  type QuotationActionState,
  type RecipientResult,
} from "../actions";
import RecipientPicker from "./recipient-picker";
import type {
  QuotationFormDefaults,
  QuotationFormItem,
  QuotationFormMember,
} from "../_lib/form-defaults";

// Re-exported so existing imports from this client module keep working.
export type {
  QuotationFormDefaults,
  QuotationFormItem,
  QuotationFormMember,
} from "../_lib/form-defaults";
export { EMPTY_QUOTATION_DEFAULTS } from "../_lib/form-defaults";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  quotationId?: string;
  defaults: QuotationFormDefaults;
  members: QuotationFormMember[];
  canManageAny: boolean;
  currentUserId: string;
};

const INITIAL_STATE: QuotationActionState = {};
const labelClass = "text-[12px] font-medium text-zinc-700 dark:text-zinc-300";

export default function QuotationForm({
  mode,
  workspaceId,
  quotationId,
  defaults,
  members,
  canManageAny,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [recipient, setRecipient] = useState<RecipientResult | null>(
    defaults.recipient,
  );
  const [currency, setCurrency] = useState<QuotationCurrency>(defaults.currency);
  const [status, setStatus] = useState<QuotationStatus>(defaults.status);
  const [issueDate, setIssueDate] = useState<Date | null>(defaults.issueDate);
  const [validUntil, setValidUntil] = useState<Date | null>(
    defaults.validUntil,
  );
  const [items, setItems] = useState<QuotationFormItem[]>(defaults.items);
  const [discount, setDiscount] = useState<number>(defaults.discount);
  const [notes, setNotes] = useState(defaults.notes);
  const [terms, setTerms] = useState(defaults.terms);
  const [assignedTo, setAssignedTo] = useState(defaults.assignedTo);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [state, formAction, pending] = useActionState(
    (prev: QuotationActionState, formData: FormData) =>
      mode === "create"
        ? createQuotation(workspaceId, prev, formData)
        : updateQuotation(workspaceId, quotationId!, prev, formData),
    INITIAL_STATE,
  );

  const totals = useMemo(
    () => computeTotals(items, discount),
    [items, discount],
  );

  const errs = state.errors;

  const assigneeOptions = useMemo<ComboboxOption<string>[]>(
    () =>
      members.map((m) => ({
        value: m.id,
        label: m.name,
        keywords: [m.email],
        renderItem: <MemberRow member={m} isYou={m.id === currentUserId} />,
        renderTrigger: (
          <MemberRow member={m} isYou={m.id === currentUserId} compact />
        ),
      })),
    [members, currentUserId],
  );

  function updateItem(idx: number, patch: Partial<QuotationFormItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0 },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  }

  function handleNumberInput(
    e: ChangeEvent<HTMLInputElement>,
    onValue: (n: number) => void,
  ) {
    const v = parseFloat(e.target.value);
    onValue(Number.isFinite(v) && v >= 0 ? v : 0);
  }

  return (
    <>
      <form action={formAction} className="space-y-5">
        <input
          type="hidden"
          name="items"
          value={JSON.stringify(items)}
          readOnly
        />
        <input
          type="hidden"
          name="recipientKind"
          value={recipient?.kind ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="recipientId"
          value={recipient?.id ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="recipientName"
          value={recipient?.name ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="recipientCompany"
          value={recipient?.company ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="recipientEmail"
          value={recipient?.email ?? ""}
          readOnly
        />
        <input
          type="hidden"
          name="issueDate"
          value={issueDate ? format(issueDate, "yyyy-MM-dd") : ""}
          readOnly
        />
        <input
          type="hidden"
          name="validUntil"
          value={validUntil ? format(validUntil, "yyyy-MM-dd") : ""}
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
        <input
          type="hidden"
          name="assignedTo"
          value={assignedTo}
          readOnly
        />

        {/* Section: Recipient */}
        <Section
          icon={UserCircle2}
          title="Recipient"
          subtitle="Pick a customer or lead from this workspace"
          accent="from-blue-500 to-indigo-600"
        >
          {recipient ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full",
                    recipient.kind === "customer"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : recipient.kind === "lead"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
                  )}
                  aria-hidden
                >
                  {recipient.kind === "customer" ? (
                    <Users className="h-4 w-4" />
                  ) : recipient.kind === "lead" ? (
                    <UserRound className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                      {recipient.name}
                    </p>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
                        recipient.kind === "customer"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : recipient.kind === "lead"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                      )}
                    >
                      {recipient.kind}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                    {recipient.company ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {recipient.company}
                      </span>
                    ) : null}
                    {recipient.company && recipient.email ? " · " : ""}
                    {recipient.email}
                    {recipient.kind === "custom" &&
                    !recipient.company &&
                    !recipient.email ? (
                      <span className="inline-flex items-center gap-1 italic">
                        <Sparkles className="h-3 w-3" />
                        Custom recipient
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
              Select a customer or lead
            </button>
          )}
          {errs?.recipient ? (
            <p className="mt-2 text-[11.5px] text-red-600 dark:text-red-400">
              {errs.recipient}
            </p>
          ) : null}
        </Section>

        {/* Section: Schedule & status */}
        <Section
          icon={CalendarRange}
          title="Schedule & status"
          subtitle="When the quote is issued, how long it's valid, and where it stands"
          accent="from-emerald-500 to-teal-600"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className={labelClass}>Issue date *</label>
              <div className="mt-2">
                <DatePicker
                  value={issueDate}
                  onChange={(d) => {
                    setIssueDate(d);
                    if (d && validUntil && validUntil < d) setValidUntil(null);
                  }}
                  placeholder="Issue date"
                  invalid={Boolean(errs?.issueDate)}
                />
              </div>
              {errs?.issueDate ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.issueDate}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Valid until</label>
              <div className="mt-2">
                <DatePicker
                  value={validUntil}
                  onChange={setValidUntil}
                  placeholder="Valid until"
                  minDate={issueDate ?? undefined}
                  invalid={Boolean(errs?.validUntil)}
                />
              </div>
              {errs?.validUntil ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.validUntil}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="mt-2 inline-flex w-full">
                <SimpleSelect
                  value={status}
                  onChange={(v) => setStatus(v as QuotationStatus)}
                  options={QUOTATION_STATUSES.map((s) => ({
                    value: s,
                    label: QUOTATION_STATUS_LABEL[s],
                  }))}
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1 text-[11px]",
                  QUOTATION_STATUS_BADGE_CLASS[status],
                  "rounded-md px-1.5 py-0.5",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    QUOTATION_STATUS_DOT_CLASS[status],
                  )}
                />
                {QUOTATION_STATUS_LABEL[status]}
              </p>
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <div className="mt-2">
                <SimpleSelect
                  value={currency}
                  onChange={(v) => setCurrency(v as QuotationCurrency)}
                  options={QUOTATION_CURRENCIES.map((c) => ({
                    value: c,
                    label: c,
                  }))}
                />
              </div>
              {errs?.currency ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.currency}
                </p>
              ) : null}
            </div>
          </div>
        </Section>

        {/* Section: Line items */}
        <Section
          icon={Receipt}
          title="Line items"
          subtitle="Per-line description, quantity, unit price, and tax %"
          accent="from-indigo-500 to-violet-600"
        >
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="hidden bg-zinc-50 px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid sm:grid-cols-[1fr_90px_120px_90px_120px_36px] sm:gap-2 dark:bg-zinc-900/60 dark:text-zinc-400">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Tax %</span>
              <span className="text-right">Line total</span>
              <span></span>
            </div>
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {items.map((it, idx) => (
                <li
                  key={idx}
                  className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_90px_120px_90px_120px_36px] sm:items-center"
                >
                  <Input
                    value={it.description}
                    onChange={(e) =>
                      updateItem(idx, { description: e.target.value })
                    }
                    placeholder="Item or service description"
                    maxLength={500}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(it.quantity)}
                    onChange={(e) =>
                      handleNumberInput(e, (n) =>
                        updateItem(idx, { quantity: n }),
                      )
                    }
                    className="sm:text-right"
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={String(it.unitPrice)}
                    onChange={(e) =>
                      handleNumberInput(e, (n) =>
                        updateItem(idx, { unitPrice: n }),
                      )
                    }
                    className="sm:text-right"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    value={String(it.taxRate)}
                    onChange={(e) =>
                      handleNumberInput(e, (n) =>
                        updateItem(idx, { taxRate: n }),
                      )
                    }
                    className="sm:text-right"
                  />
                  <div className="text-right text-[13px] font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatCurrency(lineSubtotal(it), currency)}
                  </div>
                  <button
                    type="button"
                    aria-label="Remove line"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="grid h-8 w-8 place-items-center justify-self-end rounded-md text-zinc-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/40">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-primary hover:text-primary/80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add line
              </button>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {items.length} {items.length === 1 ? "line" : "lines"}
              </p>
            </div>
          </div>
          {errs?.items ? (
            <p className="mt-2 text-[11.5px] text-red-600 dark:text-red-400">
              {errs.items}
            </p>
          ) : null}
        </Section>

        {/* Section: Notes & terms */}
        <Section
          icon={ScrollText}
          title="Notes & terms"
          subtitle="Internal notes and the terms that print on the quote"
          accent="from-amber-500 to-orange-600"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="Internal context, follow-up reminders, etc."
                className={cn(
                  "mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
                  errs?.notes &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500",
                )}
              />
              {errs?.notes ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.notes}
                </p>
              ) : null}
            </div>
            <div>
              <label className={labelClass}>Terms & conditions</label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={4}
                maxLength={4000}
                placeholder="Payment terms, validity, scope notes, etc."
                className={cn(
                  "mt-2 w-full resize-none rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100",
                  errs?.terms &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500",
                )}
              />
              {errs?.terms ? (
                <p className="mt-1.5 text-[11px] text-red-600 dark:text-red-400">
                  {errs.terms}
                </p>
              ) : null}
            </div>
          </div>
        </Section>

        {/* Section: Assignment */}
        {canManageAny ? (
          <Section
            icon={UserCircle2}
            title="Owner"
            subtitle="Who owns this quotation"
            accent="from-zinc-500 to-zinc-700"
          >
            <div className="max-w-md">
              <Combobox<string>
                value={assignedTo}
                onChange={(v) => setAssignedTo(v)}
                options={assigneeOptions}
                placeholder="Unassigned"
                searchPlaceholder="Search teammates"
                emptyText="No teammates match."
                allowClear
              />
            </div>
          </Section>
        ) : null}

        {state.formError ? (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {state.formError}
          </p>
        ) : null}

        {/* Sticky-feeling action bar with totals + submit */}
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
                    onChange={(e) =>
                      handleNumberInput(e, setDiscount)
                    }
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
                    ? "Create quotation"
                    : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <RecipientPicker
        open={pickerOpen}
        workspaceId={workspaceId}
        onOpenChange={setPickerOpen}
        onSelect={(r) => setRecipient(r)}
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
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
          />
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

function SimpleSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
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

function MemberRow({
  member,
  isYou,
  compact,
}: {
  member: QuotationFormMember;
  isYou: boolean;
  compact?: boolean;
}) {
  const size = compact ? "h-5 w-5" : "h-6 w-6";
  return (
    <span className="flex min-w-0 flex-1 items-center gap-2">
      {member.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={member.image}
          alt=""
          referrerPolicy="no-referrer"
          className={cn(
            size,
            "shrink-0 rounded-full object-cover ring-1 ring-zinc-200 dark:ring-zinc-700",
          )}
        />
      ) : (
        <span
          className={cn(
            size,
            "grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-[9px] font-semibold text-white",
          )}
        >
          {member.name.charAt(0).toUpperCase() || "?"}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px]">
          {member.name}
          {isYou ? (
            <span className="ml-1 text-[10.5px] font-medium text-zinc-400">
              · you
            </span>
          ) : null}
        </span>
        {!compact ? (
          <span className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {member.email}
          </span>
        ) : null}
      </span>
    </span>
  );
}

