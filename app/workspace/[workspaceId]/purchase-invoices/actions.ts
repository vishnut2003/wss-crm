"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Vendor from "@/models/vendor";
import PurchaseInvoice from "@/models/purchase-invoice";
import { getActorRole } from "@/lib/workspace-access";
import {
  PURCHASE_INVOICE_STATUSES,
  canManagePurchases,
  canViewPurchases,
  computeTotals,
  escapeRegex,
  formatVoucherNumber,
  lineSubtotal,
  parseDate,
  parseVoucherItems,
  type PurchaseInvoiceStatus,
} from "@/lib/voucher";

export type PurchaseInvoiceActionState = {
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
    return { ok: false as const, error: "You don't have permission to manage purchase invoices." };
  }
  return { ok: true as const, session: session as AuthedSession, role };
}

function isStatus(v: string): v is PurchaseInvoiceStatus {
  return (PURCHASE_INVOICE_STATUSES as readonly string[]).includes(v);
}

async function nextNumber(workspaceId: string, year: number): Promise<string> {
  const prefix = `PI-${year}-`;
  const last = (await PurchaseInvoice.findOne({
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
  return formatVoucherNumber("PI", year, seq);
}

type ParsedForm = {
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  vendorEmail: string;
  vendorGstin: string;
  vendorBillNumber: string;
  status: PurchaseInvoiceStatus;
  currency: string;
  invoiceDate: Date;
  dueDate: Date | null;
  discount: number;
  notes: string;
  items: ReturnType<typeof parseVoucherItems>;
};

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedForm } | { ok: false; errors: NonNullable<PurchaseInvoiceActionState["errors"]> } {
  const errors: NonNullable<PurchaseInvoiceActionState["errors"]> = {};

  const vendorId = (formData.get("partyId") as string | null)?.trim() ?? "";
  const vendorName = (formData.get("partyName") as string | null)?.trim() ?? "";
  if (!vendorId || !vendorName || !mongoose.Types.ObjectId.isValid(vendorId)) {
    errors.party = "Pick a vendor.";
  }

  const statusRaw = (formData.get("status") as string | null) ?? "unpaid";
  if (!isStatus(statusRaw)) errors.status = "Pick a status.";

  const currency = ((formData.get("currency") as string | null) ?? "INR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";

  const invoiceDate = parseDate(formData.get("primaryDate") as string | null);
  if (!invoiceDate) errors.primaryDate = "Invoice date is required.";
  const dueDate = parseDate(formData.get("secondaryDate") as string | null);
  if (invoiceDate && dueDate && dueDate < invoiceDate) {
    errors.secondaryDate = "Due date can't be before the invoice date.";
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
      vendorBillNumber: ((formData.get("vendorBillNumber") as string | null) ?? "").trim().slice(0, 64),
      status: statusRaw as PurchaseInvoiceStatus,
      currency,
      invoiceDate: invoiceDate as Date,
      dueDate,
      discount,
      notes,
      items,
    },
  };
}

async function verifyVendor(workspaceId: string, vendorId: string): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) return false;
  return Boolean(await Vendor.exists({ _id: vendorId, workspace: workspaceId }));
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

function reconcileStatus(
  pickedStatus: PurchaseInvoiceStatus,
  total: number,
  amountPaid: number,
  dueDate: Date | null,
): PurchaseInvoiceStatus {
  if (pickedStatus === "cancelled") return "cancelled";
  if (amountPaid >= total && total > 0) return "paid";
  if (amountPaid > 0) return "partial";
  if (dueDate && dueDate < new Date()) return "overdue";
  return "unpaid";
}

export async function createPurchaseInvoice(
  workspaceId: string,
  _prev: PurchaseInvoiceActionState,
  formData: FormData,
): Promise<PurchaseInvoiceActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You don't have permission to create purchase invoices." };
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
  const finalStatus = reconcileStatus(d.status, totals.total, 0, d.dueDate);

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextNumber(workspaceId, d.invoiceDate.getFullYear());
    try {
      await PurchaseInvoice.create({
        workspace: workspaceId,
        number,
        vendorBillNumber: d.vendorBillNumber,
        vendor: vendorSnapshot(d),
        currency: d.currency,
        invoiceDate: d.invoiceDate,
        dueDate: d.dueDate,
        items: persistedItems,
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        discount: d.discount,
        total: totals.total,
        amountPaid: 0,
        status: finalStatus,
        notes: d.notes,
        createdBy: ctx.session.user.id,
      });
      revalidatePath(`/workspace/${workspaceId}/purchase-invoices`);
      redirect(`/workspace/${workspaceId}/purchase-invoices`);
    } catch (err) {
      const e = err as { code?: number; digest?: string };
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      if (e?.code === 11000) continue;
      console.error("[createPurchaseInvoice] failed", err);
      return { formError: "Couldn't create the purchase invoice. Please try again." };
    }
  }
  return { formError: "Couldn't allocate an invoice number. Please try again." };
}

export async function updatePurchaseInvoice(
  workspaceId: string,
  invoiceId: string,
  _prev: PurchaseInvoiceActionState,
  formData: FormData,
): Promise<PurchaseInvoiceActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You can't edit purchase invoices." };
  }
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    return { formError: "Invalid invoice id." };
  }

  const existing = await PurchaseInvoice.findOne({
    _id: invoiceId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Purchase invoice not found." };

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
  const finalStatus = reconcileStatus(
    d.status,
    totals.total,
    existing.amountPaid ?? 0,
    d.dueDate,
  );

  existing.vendor = vendorSnapshot(d) as unknown as typeof existing.vendor;
  existing.vendorBillNumber = d.vendorBillNumber;
  existing.currency = d.currency;
  existing.invoiceDate = d.invoiceDate;
  existing.dueDate = d.dueDate;
  existing.items = persistedItems as unknown as typeof existing.items;
  existing.subtotal = totals.subtotal;
  existing.taxTotal = totals.taxTotal;
  existing.discount = d.discount;
  existing.total = totals.total;
  existing.status = finalStatus;
  existing.notes = d.notes;

  try {
    await existing.save();
  } catch (err) {
    console.error("[updatePurchaseInvoice] failed", err);
    return { formError: "Couldn't save the invoice. Please try again." };
  }

  revalidatePath(`/workspace/${workspaceId}/purchase-invoices`);
  revalidatePath(`/workspace/${workspaceId}/purchase-invoices/${invoiceId}/edit`);
  redirect(`/workspace/${workspaceId}/purchase-invoices`);
}

export async function deletePurchaseInvoice(
  workspaceId: string,
  invoiceId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { ok: false, error: "You can't delete purchase invoices." };
  }
  if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
    return { ok: false, error: "Invalid invoice id." };
  }
  const existing = await PurchaseInvoice.findOne({
    _id: invoiceId,
    workspace: workspaceId,
  })
    .select({ amountPaid: 1 })
    .lean();
  if (!existing) return { ok: false, error: "Purchase invoice not found." };
  const paid = (existing as { amountPaid?: number }).amountPaid ?? 0;
  if (paid > 0) {
    return {
      ok: false,
      error:
        "This invoice has payments allocated to it. Cancel or reverse the payments first.",
    };
  }
  await PurchaseInvoice.deleteOne({ _id: invoiceId, workspace: workspaceId });
  revalidatePath(`/workspace/${workspaceId}/purchase-invoices`);
  return { ok: true };
}
