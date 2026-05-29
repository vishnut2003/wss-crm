"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Vendor from "@/models/vendor";
import Payment from "@/models/payment";
import PurchaseInvoice from "@/models/purchase-invoice";
import { getActorRole } from "@/lib/workspace-access";
import {
  PAYMENT_MODES,
  PAYMENT_STATUSES,
  canManagePurchases,
  canViewPurchases,
  escapeRegex,
  formatVoucherNumber,
  parseAllocations,
  parseDate,
  type PaymentMode,
  type PaymentStatus,
} from "@/lib/voucher";

export type PaymentActionState = {
  ok?: true;
  formError?: string;
  errors?: Partial<
    Record<
      | "party"
      | "amount"
      | "paymentMode"
      | "currency"
      | "primaryDate"
      | "status"
      | "allocations"
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
    return { ok: false as const, error: "You don't have permission to manage payments." };
  }
  return { ok: true as const, session: session as AuthedSession, role };
}

function isStatus(v: string): v is PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(v);
}
function isMode(v: string): v is PaymentMode {
  return (PAYMENT_MODES as readonly string[]).includes(v);
}

async function nextPaymentNumber(workspaceId: string, year: number): Promise<string> {
  const prefix = `PMT-${year}-`;
  const last = (await Payment.findOne({
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
  return formatVoucherNumber("PMT", year, seq);
}

type ParsedForm = {
  vendorId: string;
  vendorName: string;
  vendorCompany: string;
  vendorEmail: string;
  vendorGstin: string;
  status: PaymentStatus;
  currency: string;
  paymentDate: Date;
  amount: number;
  paymentMode: PaymentMode;
  reference: string;
  notes: string;
  allocations: ReturnType<typeof parseAllocations>;
};

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedForm } | { ok: false; errors: NonNullable<PaymentActionState["errors"]> } {
  const errors: NonNullable<PaymentActionState["errors"]> = {};

  const vendorId = (formData.get("partyId") as string | null)?.trim() ?? "";
  const vendorName = (formData.get("partyName") as string | null)?.trim() ?? "";
  if (!vendorId || !vendorName || !mongoose.Types.ObjectId.isValid(vendorId)) {
    errors.party = "Pick a vendor.";
  }

  const statusRaw = (formData.get("status") as string | null) ?? "cleared";
  if (!isStatus(statusRaw)) errors.status = "Pick a status.";

  const modeRaw = (formData.get("paymentMode") as string | null) ?? "bank";
  if (!isMode(modeRaw)) errors.paymentMode = "Pick a payment mode.";

  const currency = ((formData.get("currency") as string | null) ?? "INR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";

  const paymentDate = parseDate(formData.get("primaryDate") as string | null);
  if (!paymentDate) errors.primaryDate = "Payment date is required.";

  const amountRaw = Number((formData.get("amount") as string | null) ?? "0");
  const amount = Number.isFinite(amountRaw) && amountRaw >= 0 ? amountRaw : 0;
  if (amount <= 0) errors.amount = "Amount must be greater than zero.";

  const allocationsRaw = (formData.get("allocations") as string | null) ?? "[]";
  const allocations = parseAllocations(allocationsRaw);
  if (allocations === null) errors.allocations = "Invalid allocations payload.";
  else if (allocations.length > 50) errors.allocations = "Too many allocations (max 50).";
  else if (allocations.some((a) => !mongoose.Types.ObjectId.isValid(a.invoiceId))) {
    errors.allocations = "One of the allocated invoices is invalid.";
  } else {
    const allocSum = allocations.reduce((s, a) => s + a.amount, 0);
    if (allocSum > amount + 0.001) {
      errors.allocations = "Allocated amount exceeds the payment amount.";
    }
  }

  const notes = ((formData.get("notes") as string | null) ?? "").trim();
  if (notes.length > 2000) errors.notes = "Notes are too long.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      vendorId,
      vendorName,
      vendorCompany: (formData.get("partyCompany") as string | null)?.trim() ?? "",
      vendorEmail: (formData.get("partyEmail") as string | null)?.trim() ?? "",
      vendorGstin: ((formData.get("partyGstin") as string | null) ?? "").trim().toUpperCase(),
      status: statusRaw as PaymentStatus,
      currency,
      paymentDate: paymentDate as Date,
      amount,
      paymentMode: modeRaw as PaymentMode,
      reference: ((formData.get("reference") as string | null) ?? "").trim().slice(0, 120),
      notes,
      allocations,
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

async function refreshPurchaseInvoices(workspaceId: string, invoiceIds: string[]) {
  const uniq = Array.from(new Set(invoiceIds)).filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (uniq.length === 0) return;

  const wsObj = new mongoose.Types.ObjectId(workspaceId);
  const sums = await Payment.aggregate<{ _id: mongoose.Types.ObjectId; paid: number }>([
    { $match: { workspace: wsObj, status: { $ne: "cancelled" } } },
    { $unwind: "$allocations" },
    {
      $match: {
        "allocations.invoice": {
          $in: uniq.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    {
      $group: {
        _id: "$allocations.invoice",
        paid: { $sum: "$allocations.amount" },
      },
    },
  ]);
  const byId = new Map(sums.map((s) => [String(s._id), s.paid]));

  const invs = await PurchaseInvoice.find({
    _id: { $in: uniq },
    workspace: workspaceId,
  });
  const now = new Date();
  for (const inv of invs) {
    const paid = byId.get(String(inv._id)) ?? 0;
    inv.amountPaid = paid;
    if (inv.status === "cancelled") {
      // keep
    } else if (paid >= inv.total && inv.total > 0) inv.status = "paid";
    else if (paid > 0) inv.status = "partial";
    else if (inv.dueDate && inv.dueDate < now) inv.status = "overdue";
    else inv.status = "unpaid";
    await inv.save();
  }
}

export async function createPayment(
  workspaceId: string,
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You don't have permission to record payments." };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  const valid = await verifyVendor(workspaceId, d.vendorId);
  if (!valid) {
    return { errors: { party: "That vendor is no longer in this workspace." } };
  }

  const allocIds = (d.allocations ?? []).map((a) => a.invoiceId);
  if (allocIds.length > 0) {
    const valid = await PurchaseInvoice.countDocuments({
      _id: { $in: allocIds },
      workspace: workspaceId,
      "vendor.refId": d.vendorId,
    });
    if (valid !== allocIds.length) {
      return {
        errors: {
          allocations: "One or more allocated invoices don't belong to this vendor.",
        },
      };
    }
  }

  const allocations = (d.allocations ?? []).map((a) => ({
    invoice: new mongoose.Types.ObjectId(a.invoiceId),
    invoiceNumber: "",
    amount: a.amount,
  }));
  if (allocations.length > 0) {
    const numbers = await PurchaseInvoice.find({
      _id: { $in: allocations.map((a) => a.invoice) },
    })
      .select({ number: 1 })
      .lean();
    const numByID = new Map(
      numbers.map((n) => [
        String((n as { _id: { toString(): string } })._id),
        (n as { number: string }).number,
      ]),
    );
    for (const a of allocations) {
      a.invoiceNumber = numByID.get(String(a.invoice)) ?? "";
    }
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextPaymentNumber(workspaceId, d.paymentDate.getFullYear());
    try {
      await Payment.create({
        workspace: workspaceId,
        number,
        vendor: vendorSnapshot(d),
        currency: d.currency,
        paymentDate: d.paymentDate,
        amount: d.amount,
        paymentMode: d.paymentMode,
        reference: d.reference,
        allocations,
        status: d.status,
        notes: d.notes,
        createdBy: ctx.session.user.id,
      });
      if (d.status !== "cancelled" && allocIds.length > 0) {
        await refreshPurchaseInvoices(workspaceId, allocIds);
      }
      revalidatePath(`/workspace/${workspaceId}/payments`);
      revalidatePath(`/workspace/${workspaceId}/purchase-invoices`);
      redirect(`/workspace/${workspaceId}/payments`);
    } catch (err) {
      const e = err as { code?: number; digest?: string };
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      if (e?.code === 11000) continue;
      console.error("[createPayment] failed", err);
      return { formError: "Couldn't record the payment. Please try again." };
    }
  }
  return { formError: "Couldn't allocate a payment number. Please try again." };
}

export async function updatePayment(
  workspaceId: string,
  paymentId: string,
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManagePurchases(ctx.role)) {
    return { formError: "You can't edit payments." };
  }
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return { formError: "Invalid payment id." };
  }
  const existing = await Payment.findOne({
    _id: paymentId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Payment not found." };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  const prevAllocIds = (existing.allocations ?? []).map((a) => String(a.invoice));

  const allocations = (d.allocations ?? []).map((a) => ({
    invoice: new mongoose.Types.ObjectId(a.invoiceId),
    invoiceNumber: "",
    amount: a.amount,
  }));
  if (allocations.length > 0) {
    const numbers = await PurchaseInvoice.find({
      _id: { $in: allocations.map((a) => a.invoice) },
      workspace: workspaceId,
      "vendor.refId": d.vendorId,
    })
      .select({ number: 1 })
      .lean();
    if (numbers.length !== allocations.length) {
      return {
        errors: {
          allocations: "One or more allocated invoices don't belong to this vendor.",
        },
      };
    }
    const numByID = new Map(
      numbers.map((n) => [
        String((n as { _id: { toString(): string } })._id),
        (n as { number: string }).number,
      ]),
    );
    for (const a of allocations) {
      a.invoiceNumber = numByID.get(String(a.invoice)) ?? "";
    }
  }

  existing.vendor = vendorSnapshot(d) as unknown as typeof existing.vendor;
  existing.currency = d.currency;
  existing.paymentDate = d.paymentDate;
  existing.amount = d.amount;
  existing.paymentMode = d.paymentMode;
  existing.reference = d.reference;
  existing.allocations = allocations as unknown as typeof existing.allocations;
  existing.status = d.status;
  existing.notes = d.notes;

  try {
    await existing.save();
  } catch (err) {
    console.error("[updatePayment] failed", err);
    return { formError: "Couldn't save the payment. Please try again." };
  }

  const affected = Array.from(
    new Set([...prevAllocIds, ...allocations.map((a) => String(a.invoice))]),
  );
  if (affected.length > 0) {
    await refreshPurchaseInvoices(workspaceId, affected);
  }

  revalidatePath(`/workspace/${workspaceId}/payments`);
  revalidatePath(`/workspace/${workspaceId}/payments/${paymentId}/edit`);
  revalidatePath(`/workspace/${workspaceId}/purchase-invoices`);
  redirect(`/workspace/${workspaceId}/payments`);
}

export async function loadOpenPurchaseInvoicesForVendor(
  workspaceId: string,
  vendorId: string,
): Promise<
  | { ok: true; results: Array<{ id: string; number: string; total: number; balance: number; currency: string; primaryDateISO: string }> }
  | { ok: false; error: string }
> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return { ok: false, error: "Invalid vendor id." };
  }
  type LeanRow = {
    _id: mongoose.Types.ObjectId;
    number: string;
    total: number;
    amountPaid: number;
    currency: string;
    invoiceDate: Date;
  };
  const docs = (await PurchaseInvoice.find({
    workspace: workspaceId,
    "vendor.refId": vendorId,
    status: { $in: ["unpaid", "partial", "overdue"] },
  })
    .sort({ invoiceDate: 1 })
    .select({ number: 1, total: 1, amountPaid: 1, currency: 1, invoiceDate: 1 })
    .limit(200)
    .lean()) as unknown as LeanRow[];
  return {
    ok: true,
    results: docs.map((d) => ({
      id: String(d._id),
      number: d.number,
      total: d.total,
      balance: Math.max(0, d.total - (d.amountPaid ?? 0)),
      currency: d.currency,
      primaryDateISO: d.invoiceDate.toISOString(),
    })),
  };
}
