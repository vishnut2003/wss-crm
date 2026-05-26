"use client";

import MoneyVoucherForm, {
  type MoneyVoucherDefaults,
  type MoneyVoucherFormState,
} from "@/components/money-voucher-form";
import {
  RECEIPT_STATUSES,
  RECEIPT_STATUS_BADGE_CLASS,
  RECEIPT_STATUS_LABEL,
  type ReceiptStatus,
} from "@/lib/voucher";
import {
  createReceipt,
  loadOpenSalesInvoicesForCustomer,
  updateReceipt,
} from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  receiptId?: string;
  defaults: MoneyVoucherDefaults<ReceiptStatus>;
};

export default function ReceiptForm({
  mode,
  workspaceId,
  receiptId,
  defaults,
}: Props) {
  const create = (prev: MoneyVoucherFormState, formData: FormData) =>
    createReceipt(workspaceId, prev, formData);
  const update = (prev: MoneyVoucherFormState, formData: FormData) =>
    updateReceipt(workspaceId, receiptId!, prev, formData);
  const loadOpen = (partyId: string) =>
    loadOpenSalesInvoicesForCustomer(workspaceId, partyId);

  return (
    <MoneyVoucherForm<ReceiptStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={receiptId}
      partyKind="customer"
      partyLabel="Customer"
      primaryDateLabel="Receipt date"
      amountLabel="Amount received"
      statuses={RECEIPT_STATUSES}
      statusLabel={RECEIPT_STATUS_LABEL}
      statusBadgeClass={RECEIPT_STATUS_BADGE_CLASS}
      defaults={defaults}
      openInvoicesByParty={loadOpen}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Record receipt"
      submitLabelEdit="Save changes"
    />
  );
}
