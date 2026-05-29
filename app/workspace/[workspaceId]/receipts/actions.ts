"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Customer from "@/models/customer";
import Receipt from "@/models/receipt";
import SalesInvoice from "@/models/sales-invoice";
import { getActorRole } from "@/lib/workspace-access";
import {
  PAYMENT_MODES,
  RECEIPT_STATUSES,
  canManageAnyVoucher,
  canManageVoucher,
  canViewVouchers,
  escapeRegex,
  formatVoucherNumber,
  parseAllocations,
  parseDate,
  type PaymentMode,
  type ReceiptStatus,
} from "@/lib/voucher";

export type ReceiptActionState = {
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
  if (!canViewVouchers(role)) {
    return { ok: false as const, error: "You don't have permission to manage receipts." };
  }
  return { ok: true as const, session: session as AuthedSession, role };
}

function isStatus(v: string): v is ReceiptStatus {
  return (RECEIPT_STATUSES as readonly string[]).includes(v);
}
function isMode(v: string): v is PaymentMode {
  return (PAYMENT_MODES as readonly string[]).includes(v);
}

async function nextReceiptNumber(workspaceId: string, year: number): Promise<string> {
  const prefix = `RCT-${year}-`;
  const last = (await Receipt.findOne({
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
  return formatVoucherNumber("RCT", year, seq);
}

type ParsedForm = {
  customerId: string;
  customerName: string;
  customerCompany: string;
  customerEmail: string;
  customerGstin: string;
  status: ReceiptStatus;
  currency: string;
  receiptDate: Date;
  amount: number;
  paymentMode: PaymentMode;
  reference: string;
  notes: string;
  allocations: ReturnType<typeof parseAllocations>;
};

function parseForm(
  formData: FormData,
): { ok: true; data: ParsedForm } | { ok: false; errors: NonNullable<ReceiptActionState["errors"]> } {
  const errors: NonNullable<ReceiptActionState["errors"]> = {};

  const customerId = (formData.get("partyId") as string | null)?.trim() ?? "";
  const customerName = (formData.get("partyName") as string | null)?.trim() ?? "";
  if (!customerId || !customerName || !mongoose.Types.ObjectId.isValid(customerId)) {
    errors.party = "Pick a customer.";
  }

  const statusRaw = (formData.get("status") as string | null) ?? "cleared";
  if (!isStatus(statusRaw)) errors.status = "Pick a status.";

  const modeRaw = (formData.get("paymentMode") as string | null) ?? "bank";
  if (!isMode(modeRaw)) errors.paymentMode = "Pick a payment mode.";

  const currency = ((formData.get("currency") as string | null) ?? "INR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";

  const receiptDate = parseDate(formData.get("primaryDate") as string | null);
  if (!receiptDate) errors.primaryDate = "Receipt date is required.";

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
      errors.allocations = "Allocated amount exceeds the receipt amount.";
    }
  }

  const notes = ((formData.get("notes") as string | null) ?? "").trim();
  if (notes.length > 2000) errors.notes = "Notes are too long.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      customerId,
      customerName,
      customerCompany: (formData.get("partyCompany") as string | null)?.trim() ?? "",
      customerEmail: (formData.get("partyEmail") as string | null)?.trim() ?? "",
      customerGstin: ((formData.get("partyGstin") as string | null) ?? "").trim().toUpperCase(),
      status: statusRaw as ReceiptStatus,
      currency,
      receiptDate: receiptDate as Date,
      amount,
      paymentMode: modeRaw as PaymentMode,
      reference: ((formData.get("reference") as string | null) ?? "").trim().slice(0, 120),
      notes,
      allocations,
    },
  };
}

async function verifyCustomer(
  workspaceId: string,
  customerId: string,
  actor: { id: string; scopedToSelf: boolean },
): Promise<boolean> {
  if (!mongoose.Types.ObjectId.isValid(customerId)) return false;
  const filter: Record<string, unknown> = { _id: customerId, workspace: workspaceId };
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

// Recompute amountPaid + status for the given invoice ids based on the
// canonical sum of cleared receipts allocated to them.
async function refreshInvoices(workspaceId: string, invoiceIds: string[]) {
  const uniq = Array.from(new Set(invoiceIds)).filter((id) =>
    mongoose.Types.ObjectId.isValid(id),
  );
  if (uniq.length === 0) return;

  const wsObj = new mongoose.Types.ObjectId(workspaceId);
  // For each invoice, sum the matching allocations from non-cancelled receipts.
  const sums = await Receipt.aggregate<{ _id: mongoose.Types.ObjectId; paid: number }>([
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

  const invs = await SalesInvoice.find({
    _id: { $in: uniq },
    workspace: workspaceId,
  });
  const now = new Date();
  for (const inv of invs) {
    const paid = byId.get(String(inv._id)) ?? 0;
    inv.amountPaid = paid;
    if (inv.status === "cancelled") {
      // Cancelled stays cancelled.
    } else if (paid >= inv.total && inv.total > 0) inv.status = "paid";
    else if (paid > 0) inv.status = "partial";
    else if (inv.dueDate && inv.dueDate < now) inv.status = "overdue";
    else inv.status = "unpaid";
    await inv.save();
  }
}

export async function createReceipt(
  workspaceId: string,
  _prev: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
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
    return { formError: "You don't have permission to record receipts." };
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

  // Verify allocated invoices belong to the same customer + workspace.
  const allocIds = (d.allocations ?? []).map((a) => a.invoiceId);
  if (allocIds.length > 0) {
    const valid = await SalesInvoice.countDocuments({
      _id: { $in: allocIds },
      workspace: workspaceId,
      "customer.refId": d.customerId,
    });
    if (valid !== allocIds.length) {
      return {
        errors: {
          allocations:
            "One or more allocated invoices don't belong to this customer.",
        },
      };
    }
  }

  const allocations = (d.allocations ?? []).map((a) => ({
    invoice: new mongoose.Types.ObjectId(a.invoiceId),
    invoiceNumber: "",
    amount: a.amount,
  }));

  // Look up invoice numbers for the snapshot.
  if (allocations.length > 0) {
    const numbers = await SalesInvoice.find({
      _id: { $in: allocations.map((a) => a.invoice) },
    })
      .select({ number: 1 })
      .lean();
    const numByID = new Map(numbers.map((n) => [String((n as { _id: { toString(): string } })._id), (n as { number: string }).number]));
    for (const a of allocations) {
      a.invoiceNumber = numByID.get(String(a.invoice)) ?? "";
    }
  }

  const assignedTo = canManageAnyVoucher(ctx.role) ? null : ctx.session.user.id;

  for (let attempt = 0; attempt < 3; attempt++) {
    const number = await nextReceiptNumber(workspaceId, d.receiptDate.getFullYear());
    try {
      await Receipt.create({
        workspace: workspaceId,
        number,
        customer: customerSnapshot(d),
        currency: d.currency,
        receiptDate: d.receiptDate,
        amount: d.amount,
        paymentMode: d.paymentMode,
        reference: d.reference,
        allocations,
        status: d.status,
        notes: d.notes,
        createdBy: ctx.session.user.id,
        assignedTo,
      });
      if (d.status !== "cancelled" && allocIds.length > 0) {
        await refreshInvoices(workspaceId, allocIds);
      }
      revalidatePath(`/workspace/${workspaceId}/receipts`);
      revalidatePath(`/workspace/${workspaceId}/sale-invoices`);
      revalidatePath(`/workspace/${workspaceId}/recovery`);
      redirect(`/workspace/${workspaceId}/receipts`);
    } catch (err) {
      const e = err as { code?: number; digest?: string };
      if (e?.digest?.startsWith?.("NEXT_REDIRECT")) throw err;
      if (e?.code === 11000) continue;
      console.error("[createReceipt] failed", err);
      return { formError: "Couldn't record the receipt. Please try again." };
    }
  }
  return { formError: "Couldn't allocate a receipt number. Please try again." };
}

export async function updateReceipt(
  workspaceId: string,
  receiptId: string,
  _prev: ReceiptActionState,
  formData: FormData,
): Promise<ReceiptActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!mongoose.Types.ObjectId.isValid(receiptId)) {
    return { formError: "Invalid receipt id." };
  }

  const existing = await Receipt.findOne({
    _id: receiptId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Receipt not found." };

  const ownerIds = {
    createdBy: String(existing.createdBy),
    assignedTo: existing.assignedTo ? String(existing.assignedTo) : null,
  };
  if (!canManageVoucher(ctx.role, ctx.session.user.id, ownerIds)) {
    return { formError: "You can't edit this receipt." };
  }

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
    const numbers = await SalesInvoice.find({
      _id: { $in: allocations.map((a) => a.invoice) },
      workspace: workspaceId,
      "customer.refId": d.customerId,
    })
      .select({ number: 1 })
      .lean();
    if (numbers.length !== allocations.length) {
      return {
        errors: {
          allocations:
            "One or more allocated invoices don't belong to this customer.",
        },
      };
    }
    const numByID = new Map(numbers.map((n) => [String((n as { _id: { toString(): string } })._id), (n as { number: string }).number]));
    for (const a of allocations) {
      a.invoiceNumber = numByID.get(String(a.invoice)) ?? "";
    }
  }

  existing.customer = customerSnapshot(d) as unknown as typeof existing.customer;
  existing.currency = d.currency;
  existing.receiptDate = d.receiptDate;
  existing.amount = d.amount;
  existing.paymentMode = d.paymentMode;
  existing.reference = d.reference;
  existing.allocations = allocations as unknown as typeof existing.allocations;
  existing.status = d.status;
  existing.notes = d.notes;

  try {
    await existing.save();
  } catch (err) {
    console.error("[updateReceipt] failed", err);
    return { formError: "Couldn't save the receipt. Please try again." };
  }

  const affectedInvoiceIds = Array.from(
    new Set([...prevAllocIds, ...allocations.map((a) => String(a.invoice))]),
  );
  if (affectedInvoiceIds.length > 0) {
    await refreshInvoices(workspaceId, affectedInvoiceIds);
  }

  revalidatePath(`/workspace/${workspaceId}/receipts`);
  revalidatePath(`/workspace/${workspaceId}/receipts/${receiptId}/edit`);
  revalidatePath(`/workspace/${workspaceId}/sale-invoices`);
  revalidatePath(`/workspace/${workspaceId}/recovery`);
  redirect(`/workspace/${workspaceId}/receipts`);
}

// Used by the Receipt form to populate the "Pick invoice" picker. Returns
// the customer's open / partially-paid invoices.
export async function loadOpenSalesInvoicesForCustomer(
  workspaceId: string,
  customerId: string,
): Promise<
  | { ok: true; results: Array<{ id: string; number: string; total: number; balance: number; currency: string; primaryDateISO: string }> }
  | { ok: false; error: string }
> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    return { ok: false, error: "Invalid customer id." };
  }
  type LeanRow = {
    _id: mongoose.Types.ObjectId;
    number: string;
    total: number;
    amountPaid: number;
    currency: string;
    invoiceDate: Date;
  };
  const docs = (await SalesInvoice.find({
    workspace: workspaceId,
    "customer.refId": customerId,
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
