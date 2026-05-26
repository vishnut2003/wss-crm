"use client";

import ItemizedVoucherForm, {
  type ItemizedVoucherDefaults,
  type VoucherFormState,
} from "@/components/itemized-voucher-form";
import {
  SALES_INVOICE_STATUSES,
  SALES_INVOICE_STATUS_BADGE_CLASS,
  SALES_INVOICE_STATUS_LABEL,
  type SalesInvoiceStatus,
} from "@/lib/voucher";
import { createSalesInvoice, updateSalesInvoice } from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  invoiceId?: string;
  defaults: ItemizedVoucherDefaults & { status: SalesInvoiceStatus };
};

export default function SalesInvoiceForm({
  mode,
  workspaceId,
  invoiceId,
  defaults,
}: Props) {
  const create = (prev: VoucherFormState, formData: FormData) =>
    createSalesInvoice(workspaceId, prev, formData);
  const update = (prev: VoucherFormState, formData: FormData) =>
    updateSalesInvoice(workspaceId, invoiceId!, prev, formData);

  return (
    <ItemizedVoucherForm<SalesInvoiceStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={invoiceId}
      partyKind="customer"
      partyLabel="Customer"
      primaryDateLabel="Invoice date"
      secondaryDateLabel="Due date"
      statuses={SALES_INVOICE_STATUSES}
      statusLabel={SALES_INVOICE_STATUS_LABEL}
      statusBadgeClass={SALES_INVOICE_STATUS_BADGE_CLASS}
      defaults={defaults}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Create sales invoice"
      submitLabelEdit="Save changes"
    />
  );
}
