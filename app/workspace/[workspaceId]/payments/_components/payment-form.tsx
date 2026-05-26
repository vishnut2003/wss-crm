"use client";

import MoneyVoucherForm, {
  type MoneyVoucherDefaults,
  type MoneyVoucherFormState,
} from "@/components/money-voucher-form";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_LABEL,
  type PaymentStatus,
} from "@/lib/voucher";
import {
  createPayment,
  loadOpenPurchaseInvoicesForVendor,
  updatePayment,
} from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  paymentId?: string;
  defaults: MoneyVoucherDefaults<PaymentStatus>;
};

export default function PaymentForm({
  mode,
  workspaceId,
  paymentId,
  defaults,
}: Props) {
  const create = (prev: MoneyVoucherFormState, formData: FormData) =>
    createPayment(workspaceId, prev, formData);
  const update = (prev: MoneyVoucherFormState, formData: FormData) =>
    updatePayment(workspaceId, paymentId!, prev, formData);
  const loadOpen = (partyId: string) =>
    loadOpenPurchaseInvoicesForVendor(workspaceId, partyId);

  return (
    <MoneyVoucherForm<PaymentStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={paymentId}
      partyKind="vendor"
      partyLabel="Vendor"
      primaryDateLabel="Payment date"
      amountLabel="Amount paid"
      statuses={PAYMENT_STATUSES}
      statusLabel={PAYMENT_STATUS_LABEL}
      statusBadgeClass={PAYMENT_STATUS_BADGE_CLASS}
      defaults={defaults}
      openInvoicesByParty={loadOpen}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Record payment"
      submitLabelEdit="Save changes"
    />
  );
}
