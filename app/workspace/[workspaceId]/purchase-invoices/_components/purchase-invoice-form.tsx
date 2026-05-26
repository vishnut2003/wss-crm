"use client";

import ItemizedVoucherForm, {
  type ItemizedVoucherDefaults,
  type VoucherFormState,
} from "@/components/itemized-voucher-form";
import {
  PURCHASE_INVOICE_STATUSES,
  PURCHASE_INVOICE_STATUS_BADGE_CLASS,
  PURCHASE_INVOICE_STATUS_LABEL,
  type PurchaseInvoiceStatus,
} from "@/lib/voucher";
import { createPurchaseInvoice, updatePurchaseInvoice } from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  invoiceId?: string;
  defaults: ItemizedVoucherDefaults & { status: PurchaseInvoiceStatus };
  vendorBillNumberDefault?: string;
};

export default function PurchaseInvoiceForm({
  mode,
  workspaceId,
  invoiceId,
  defaults,
  vendorBillNumberDefault,
}: Props) {
  const create = (prev: VoucherFormState, formData: FormData) =>
    createPurchaseInvoice(workspaceId, prev, formData);
  const update = (prev: VoucherFormState, formData: FormData) =>
    updatePurchaseInvoice(workspaceId, invoiceId!, prev, formData);

  return (
    <ItemizedVoucherForm<PurchaseInvoiceStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={invoiceId}
      partyKind="vendor"
      partyLabel="Vendor"
      primaryDateLabel="Invoice date"
      secondaryDateLabel="Due date"
      statuses={PURCHASE_INVOICE_STATUSES}
      statusLabel={PURCHASE_INVOICE_STATUS_LABEL}
      statusBadgeClass={PURCHASE_INVOICE_STATUS_BADGE_CLASS}
      defaults={defaults}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Create purchase invoice"
      submitLabelEdit="Save changes"
      extraSchedule={
        <div>
          <label
            htmlFor="vendorBillNumber"
            className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
          >
            Vendor bill number
          </label>
          <input
            id="vendorBillNumber"
            name="vendorBillNumber"
            defaultValue={vendorBillNumberDefault ?? ""}
            maxLength={64}
            placeholder="Vendor's own bill / invoice reference"
            className="mt-2 h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>
      }
    />
  );
}
