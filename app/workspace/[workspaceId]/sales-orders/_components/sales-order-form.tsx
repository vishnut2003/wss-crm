"use client";

import ItemizedVoucherForm, {
  type ItemizedVoucherDefaults,
  type VoucherFormState,
} from "@/components/itemized-voucher-form";
import {
  SALES_ORDER_STATUSES,
  SALES_ORDER_STATUS_BADGE_CLASS,
  SALES_ORDER_STATUS_LABEL,
  type SalesOrderStatus,
} from "@/lib/voucher";
import { createSalesOrder, updateSalesOrder } from "../actions";

type Props = {
  mode: "create" | "edit";
  workspaceId: string;
  orderId?: string;
  defaults: ItemizedVoucherDefaults & { status: SalesOrderStatus };
};

export default function SalesOrderForm({
  mode,
  workspaceId,
  orderId,
  defaults,
}: Props) {
  const create = (prev: VoucherFormState, formData: FormData) =>
    createSalesOrder(workspaceId, prev, formData);
  const update = (prev: VoucherFormState, formData: FormData) =>
    updateSalesOrder(workspaceId, orderId!, prev, formData);

  return (
    <ItemizedVoucherForm<SalesOrderStatus>
      mode={mode}
      workspaceId={workspaceId}
      voucherId={orderId}
      partyKind="customer"
      partyLabel="Customer"
      primaryDateLabel="Order date"
      secondaryDateLabel="Expected delivery"
      statuses={SALES_ORDER_STATUSES}
      statusLabel={SALES_ORDER_STATUS_LABEL}
      statusBadgeClass={SALES_ORDER_STATUS_BADGE_CLASS}
      defaults={defaults}
      createAction={create}
      updateAction={update}
      submitLabelCreate="Create sales order"
      submitLabelEdit="Save changes"
    />
  );
}
