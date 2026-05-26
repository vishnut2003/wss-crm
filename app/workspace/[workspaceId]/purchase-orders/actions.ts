"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Vendor from "@/models/vendor";
import PurchaseOrder from "@/models/purchase-order";
import { getActorRole } from "@/lib/workspace-access";
import {
  PURCHASE_ORDER_STATUSES,
  canManagePurchases,
  canViewPurchases,
  computeTotals,
  escapeRegex,
  formatVoucherNumber,
  lineSubtotal,
  parseDate,
  parseVoucherItems,
  type PurchaseOrderStatus,
} from "@/lib/voucher";

export type PurchaseOrderActionState = {
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
    return { ok: false as const, error: "Your session expired. Please sign in again." };
  }
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { ok: false as const, error: "Invalid workspace." };
  }
  await connectDB();
  const workspaceDoc = await Workspace.findById(workspaceId);
  if (!workspaceDoc) return { ok: false as const, error: "Workspace not found." };
  const role = getActorRole(workspaceDoc, session.user.id);
  if (!canViewPurchases(role)) {
    return { ok: false as const, error: "You don't have permission to manage purchase orders." };
  }
  return { ok: true as const, session: session as AuthedSession, role };
}

function isStatus(v: string): v is PurchaseOrderStatus {
  return (PURCHASE_ORDER_STATUSES as readonly string[]).includes(v);
}

async function nextNumber(workspaceId: string, year: number): Promise<string> {
  const prefix = `PO-${year}-`;
  const last = (await PurchaseOrder.findOne({
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
  return formatVoucherNumber("PO", year, seq);
}

type ParsedForm = {
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  vendorEmail: string;
  vendorGstin: string;
  status: PurchaseOrderStatus;
  currency: string;
  orderDate: Date;
  expectedDate: Date | null;
  discount: number;
  notes: string;
  items: ReturnType<typeof parseVoucherItems>;
};

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedForm } | { ok: false; errors: NonNullable<PurchaseOrderActionState["errors"]> } {
  const errors: NonNullable<PurchaseOrderActionState["errors"]> = {};

  const vendorId = (formData.get("partyId") as string | null)?.trim() ?? "";
  const vendorName = (formData.get("partyName") as string | null)?.trim() ?? "";
  if (!vendorId || !vendorName || !mongoose.Types.ObjectId.isValid(vendorId)) {
    errors.party = "Pick a vendor.";
  }

  const statusRaw = (formData.get("status") as string | null) ?? "draft";
  if (!isStatus(statusRaw)) errors.status = "Pick a status.";

  const currency = ((formData.get("currency") as string | null) ?? "INR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";

  const orderDate = parseDate(formData.get("primaryDate") as string | null);
  if (!orderDate) errors.primaryDate = "Order date is required.";
  const expectedDate = parseDate(formData.get("secondaryDate") as string | null);
  if (orderDate && expectedDate && expectedDate < orderDate) {
    errors.secondaryDate = "Expected date can't be before the order date.";
  }

  const discountRaw = Number((formData.get("discount") as string | null) ?? "0");
  const discount = Number.isFinite(discountRaw) && discountRaw >= 0 ? discountRaw : 0;

  const notes = ((formData.get("notes") as string | null) ?? "").trim();
  if (notes.length > 4000) errors.notes = "Notes are too long.";

  const itemsRaw = (formData.get("items") as string | null) ?? "[]";
  const items = parseVoucherItems(itemsRaw);
  if (!items || items.length === 0) errors.items = "Add at least one line item.";
  else if (items.some((it) => !it.description)) errors.items = "Every line item needs a description.";
  else if (items.length > 100) errors.items = "Too many line items (max 100).";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      vendorId,
      vendorName,
      vendorCompany: (formData.get("partyCompany") as string | null)?.trim() ?? "",
      vendorEmail: (formData.get("partyEmail") as string | null)?.trim() ?? "",
      vendorGstin: ((formData.get("partyGstin") as string | null) ?? "").trim().toUpperCase(),
      status: statusRaw as PurchaseOrderStatus,
      currency,
      orderDate: orderDate as Date,
      expectedDate,
      discount,
      notes,
      items,
    },
  };
}

async function verifyVendor(workspaceId: string, vendorId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) return false;
  return Boolean(
    await Vendor.exists({ _id: vendorId, workspace: workspaceId }),
  );
}

function vendorSnapshot(d: ParsedForm) {
  return {
    refId: new mongoose.Types.ObjectId(d.vendorId),
    name: d.vendorName,
    company: d.vendorCompany,
    email: d.vendorEmail,
    gstin: d.vendorGstin,
  };
}

export async function createPurchaseOrder(
  workspaceId: string,
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You don't have permission to create purchase orders." };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  const valid = await verifyVendor(workspaceId, d.vendorId);
  if (!valid) {
    return { errors: { party: "That vendor is no longer in this workspace." } };
  }

  const persistedItems = (d.items ?? []).map((it) => ({
    ...it,
    lineTotal: lineSubtotal(it),
  }));
  const totals = computeTotals(d.items ?? [], d.discount);

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextNumber(workspaceId, d.orderDate.getFullYear());
    try {
      await PurchaseOrder.create({
        workspace: workspaceId,
        number,
        vendor: vendorSnapshot(d),
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
      });
      revalidatePath(`/workspace/${workspaceId}/purchase-orders`);
      redirect(`/workspace/${workspaceId}/purchase-orders`);
    } catch (err) {
      const e = err as { code?: number; digest?: string };
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      if (e?.code === 11000) continue;
      console.error("[createPurchaseOrder] failed", err);
      return { formError: "Couldn't create the purchase order. Please try again." };
    }
  }
  return { formError: "Couldn't allocate a purchase-order number. Please try again." };
}

export async function updatePurchaseOrder(
  workspaceId: string,
  orderId: string,
  _prev: PurchaseOrderActionState,
  formData: FormData,
): Promise<PurchaseOrderActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You can't edit purchase orders." };
  }
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { formError: "Invalid purchase-order id." };
  }

  const existing = await PurchaseOrder.findOne({
    _id: orderId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Purchase order not found." };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  const valid = await verifyVendor(workspaceId, d.vendorId);
  if (!valid) {
    return { errors: { party: "That vendor is no longer in this workspace." } };
  }

  const persistedItems = (d.items ?? []).map((it) => ({
    ...it,
    lineTotal: lineSubtotal(it),
  }));
  const totals = computeTotals(d.items ?? [], d.discount);

  existing.vendor = vendorSnapshot(d) as unknown as typeof existing.vendor;
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
    console.error("[updatePurchaseOrder] failed", err);
    return { formError: "Couldn't save the purchase order. Please try again." };
  }

  revalidatePath(`/workspace/${workspaceId}/purchase-orders`);
  revalidatePath(`/workspace/${workspaceId}/purchase-orders/${orderId}/edit`);
  redirect(`/workspace/${workspaceId}/purchase-orders`);
}

export async function deletePurchaseOrder(
  workspaceId: string,
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { ok: false, error: "You can't delete purchase orders." };
  }
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return { ok: false, error: "Invalid purchase-order id." };
  }
  await PurchaseOrder.deleteOne({ _id: orderId, workspace: workspaceId });
  revalidatePath(`/workspace/${workspaceId}/purchase-orders`);
  return { ok: true };
}
