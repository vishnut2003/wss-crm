"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Customer from "@/models/customer";
import SalesOrder from "@/models/sales-order";
import { getActorRole } from "@/lib/workspace-access";
import {
  SALES_ORDER_STATUSES,
  canManageAnyVoucher,
  canManageVoucher,
  canViewVouchers,
  computeTotals,
  escapeRegex,
  formatVoucherNumber,
  lineSubtotal,
  parseDate,
  parseVoucherItems,
  type SalesOrderStatus,
} from "@/lib/voucher";

export type SalesOrderActionState = {
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

type AuthedSession = Session & {
  user: NonNullable<Session["user"]> & { id: string };
};

async function loadContext(workspaceId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      ok: false as const,
      error: "Your session expired. Please sign in again.",
    };
  }
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { ok: false as const, error: "Invalid workspace." };
  }
  await connectDB();
  const workspaceDoc = await Workspace.findById(workspaceId);
  if (!workspaceDoc) return { ok: false as const, error: "Workspace not found." };
  const role = getActorRole(workspaceDoc, session.user.id);
  if (!canViewVouchers(role)) {
    return {
      ok: false as const,
      error: "You don't have permission to manage sales orders.",
    };
  }
  return {
    ok: true as const,
    session: session as AuthedSession,
    role,
  };
}

function isStatus(v: string): v is SalesOrderStatus {
  return (SALES_ORDER_STATUSES as readonly string[]).includes(v);
}

async function nextSalesOrderNumber(
  workspaceId: string,
  year: number,
): Promise<string> {
  const prefix = `SO-${year}-`;
  const last = (await SalesOrder.findOne({
    workspace: workspaceId,
    number: new RegExp(`^${escapeRegex(prefix)}`),
  })
    .sort({ number: -1 })
    .select({ number: 1 })
    .lean()
    .exec()) as { number?: string } | null;

  let seq = 1;
  if (last?.number) {
    const match = last.number.match(/(\d+)$/);
    if (match) seq = parseInt(match[1], 10) + 1;
  }
  return formatVoucherNumber("SO", year, seq);
}

type ParsedForm = {
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerGstin: string;
  status: SalesOrderStatus;
  currency: string;
  orderDate: Date;
  expectedDate: Date | null;
  discount: number;
  notes: string;
  items: ReturnType<typeof parseVoucherItems>;
};

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedForm } | { ok: false; errors: NonNullable<SalesOrderActionState["errors"]> } {
  const errors: NonNullable<SalesOrderActionState["errors"]> = {};

  const customerId = (formData.get("partyId") as string | null)?.trim() ?? "";
  const customerName = (formData.get("partyName") as string | null)?.trim() ?? "";
  if (!customerId || !customerName || !mongoose.Types.ObjectId.isValid(customerId)) {
    errors.party = "Pick a customer.";
  }

  const statusRaw = (formData.get("status") as string | null) ?? "draft";
  if (!isStatus(statusRaw)) errors.status = "Pick a status.";

  const currency = ((formData.get("currency") as string | null) ?? "INR")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";

  const orderDate = parseDate(formData.get("primaryDate") as string | null);
  if (!orderDate) errors.primaryDate = "Order date is required.";
  const expectedDate = parseDate(formData.get("secondaryDate") as string | null);
  if (orderDate && expectedDate && expectedDate < orderDate) {
    errors.secondaryDate = "Expected date can't be before the order date.";
  }

  const discountRaw = Number((formData.get("discount") as string | null) ?? "0");
  const discount =
    Number.isFinite(discountRaw) && discountRaw >= 0 ? discountRaw : 0;

  const notes = ((formData.get("notes") as string | null) ?? "").trim();
  if (notes.length > 4000) errors.notes = "Notes are too long.";

  const itemsRaw = (formData.get("items") as string | null) ?? "[]";
  const items = parseVoucherItems(itemsRaw);
  if (!items || items.length === 0) errors.items = "Add at least one line item.";
  else if (items.some((it) => !it.description))
    errors.items = "Every line item needs a description.";
  else if (items.length > 100) errors.items = "Too many line items (max 100).";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      customerId,
      customerName,
      customerCompany:
        (formData.get("partyCompany") as string | null)?.trim() ?? "",
      customerEmail:
        (formData.get("partyEmail") as string | null)?.trim() ?? "",
      customerGstin:
        ((formData.get("partyGstin") as string | null) ?? "")
          .trim()
          .toUpperCase(),
      status: statusRaw as SalesOrderStatus,
      currency,
      orderDate: orderDate as Date,
      expectedDate,
      discount,
      notes,
      items,
    },
  };
}

async function verifyCustomer(
  workspaceId: string,
  customerId: string,
  actor: { id: string; scopedToSelf: boolean },
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return false;
  const filter: Record<string, unknown> = {
    _id: customerId,
    workspace: workspaceId,
  };
  if (actor.scopedToSelf) filter.assignedTo = actor.id;
  return Boolean(await Customer.exists(filter));
}

function customerSnapshot(d: ParsedForm) {
  return {
    refId: new mongoose.Types.ObjectId(d.customerId),
    name: d.customerName,
    company: d.customerCompany,
    email: d.customerEmail,
    gstin: d.customerGstin,
  };
}

export async function createSalesOrder(
  workspaceId: string,
  _prev: SalesOrderActionState,
  formData: FormData,
): Promise<SalesOrderActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  if (
    !canManageVoucher(ctx.role, ctx.session.user.id, {
      createdBy: ctx.session.user.id,
      assignedTo: null,
    })
  ) {
    return { formError: "You don't have permission to create sales orders." };
  }

  const valid = await verifyCustomer(workspaceId, d.customerId, {
    id: ctx.session.user.id,
    scopedToSelf: ctx.role === "sales_executive",
  });
  if (!valid) {
    return {
      errors: {
        party:
          ctx.role === "sales_executive"
            ? "Pick a customer assigned to you."
            : "That customer is no longer in this workspace.",
      },
    };
  }

  const persistedItems = (d.items ?? []).map((it) => ({
    ...it,
    lineTotal: lineSubtotal(it),
  }));
  const totals = computeTotals(d.items ?? [], d.discount);

  const assignedTo = canManageAnyVoucher(ctx.role) ? null : ctx.session.user.id;

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextSalesOrderNumber(
      workspaceId,
      d.orderDate.getFullYear(),
    );
    try {
      await SalesOrder.create({
        workspace: workspaceId,
        number,
        customer: customerSnapshot(d),
        currency: d.currency,
        orderDate: d.orderDate,
        expectedDate: d.expectedDate,
        items: persistedItems,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discount: d.discount,
        total: totals.total,
        status: d.status,
        notes: d.notes,
        createdBy: ctx.session.user.id,
        assignedTo,
      });
      revalidatePath(`/workspace/${workspaceId}/sales-orders`);
      redirect(`/workspace/${workspaceId}/sales-orders`);
    } catch (err) {
      const e = err as { code?: number; digest?: string };
      // Next.js redirect throws a special error; bubble it.
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      if (e?.code === 11000) continue;
      console.error("[createSalesOrder] failed", err);
      return { formError: "Couldn't create the sales order. Please try again." };
    }
  }
  return {
    formError: "Couldn't allocate a sales-order number. Please try again.",
  };
}

export async function updateSalesOrder(
  workspaceId: string,
  orderId: string,
  _prev: SalesOrderActionState,
  formData: FormData,
): Promise<SalesOrderActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { formError: "Invalid sales-order id." };
  }

  const existing = await SalesOrder.findOne({
    _id: orderId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Sales order not found." };

  const ownerIds = {
    createdBy: String(existing.createdBy),
    assignedTo: existing.assignedTo ? String(existing.assignedTo) : null,
  };
  if (!canManageVoucher(ctx.role, ctx.session.user.id, ownerIds)) {
    return { formError: "You can't edit this sales order." };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  const customerUnchanged =
    String(existing.customer.refId ?? "") === d.customerId;
  const scopedToSelf = ctx.role === "sales_executive" && !customerUnchanged;
  const valid = await verifyCustomer(workspaceId, d.customerId, {
    id: ctx.session.user.id,
    scopedToSelf,
  });
  if (!valid) {
    return {
      errors: {
        party:
          ctx.role === "sales_executive"
            ? "Pick a customer assigned to you."
            : "That customer is no longer in this workspace.",
      },
    };
  }

  const persistedItems = (d.items ?? []).map((it) => ({
    ...it,
    lineTotal: lineSubtotal(it),
  }));
  const totals = computeTotals(d.items ?? [], d.discount);

  existing.customer = customerSnapshot(d) as unknown as typeof existing.customer;
  existing.currency = d.currency;
  existing.orderDate = d.orderDate;
  existing.expectedDate = d.expectedDate;
  existing.items = persistedItems as unknown as typeof existing.items;
  existing.subtotal = totals.subtotal;
  existing.taxTotal = totals.taxTotal;
  existing.discount = d.discount;
  existing.total = totals.total;
  existing.status = d.status;
  existing.notes = d.notes;

  try {
    await existing.save();
  } catch (err) {
    console.error("[updateSalesOrder] failed", err);
    return { formError: "Couldn't save the sales order. Please try again." };
  }

  revalidatePath(`/workspace/${workspaceId}/sales-orders`);
  revalidatePath(`/workspace/${workspaceId}/sales-orders/${orderId}/edit`);
  redirect(`/workspace/${workspaceId}/sales-orders`);
}

export async function deleteSalesOrder(
  workspaceId: string,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { ok: false, error: "Invalid sales-order id." };
  }
  const existing = await SalesOrder.findOne({
    _id: orderId,
    workspace: workspaceId,
  })
    .select({ createdBy: 1, assignedTo: 1 })
    .lean();
  if (!existing) return { ok: false, error: "Sales order not found." };

  const ownerIds = {
    createdBy: String((existing as { createdBy: unknown }).createdBy),
    assignedTo: (existing as { assignedTo: unknown }).assignedTo
      ? String((existing as { assignedTo: unknown }).assignedTo)
      : null,
  };
  if (!canManageVoucher(ctx.role, ctx.session.user.id, ownerIds)) {
    return { ok: false, error: "You can't delete this sales order." };
  }

  await SalesOrder.deleteOne({ _id: orderId, workspace: workspaceId });
  revalidatePath(`/workspace/${workspaceId}/sales-orders`);
  return { ok: true };
}
