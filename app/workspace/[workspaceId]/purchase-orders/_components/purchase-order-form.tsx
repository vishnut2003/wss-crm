"use client";

import ItemizedVoucherForm, {
  type ItemizedVoucherDefaults,
  type VoucherFormState,
} from "@/components/itemized-voucher-form";
import {
  PURCHASE_ORDER_STATUSES,
  PURCHASE_ORDER_STATUS_BADGE_CLASS,
  PURCHASE_ORDER_STATUS_LABEL,
  type PurchaseOrderStatus,
} from "@/lib/voucher";
import { createPurchaseOrder, updatePurchaseOrder } from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  orderId?: string;
  defaults: ItemizedVoucherDefaults & { status: PurchaseOrderStatus };
};

export default function PurchaseOrderForm({
  mode,
  workspaceId,
  orderId,
  defaults,
}: Props) {
  const create = (prev: VoucherFormState, formData: FormData) =>
    createPurchaseOrder(workspaceId, prev, formData);
  const update = (prev: VoucherFormState, formData: FormData) =>
    updatePurchaseOrder(workspaceId, orderId!, prev, formData);

  return (
    <ItemizedVoucherForm<PurchaseOrderStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={orderId}
      partyKind="vendor"
      partyLabel="Vendor"
      primaryDateLabel="Order date"
      secondaryDateLabel="Expected delivery"
      statuses={PURCHASE_ORDER_STATUSES}
      statusLabel={PURCHASE_ORDER_STATUS_LABEL}
      statusBadgeClass={PURCHASE_ORDER_STATUS_BADGE_CLASS}
      defaults={defaults}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Create purchase order"
      submitLabelEdit="Save changes"
    />
  );
}
