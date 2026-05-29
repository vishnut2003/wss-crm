"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Vendor, { VENDOR_STATUSES, type VendorStatus } from "@/models/vendor";
import Payment from "@/models/payment";
import PurchaseInvoice from "@/models/purchase-invoice";
import PurchaseOrder from "@/models/purchase-order";
import { getActorRole } from "@/lib/workspace-access";
import { canManageVendors, canViewVendors } from "@/lib/voucher";

export type VendorActionState = {
  ok?: true;
  formError?: string;
  errors?: Partial<
    Record<
      | "name"
      | "email"
      | "phone"
      | "status"
      | "gstin"
      | "pan",
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
  if (!canViewVendors(role)) {
    return {
      ok: false as const,
      error: "You don't have permission to manage vendors.",
    };
  }
  return {
    ok: true as const,
    session: session as AuthedSession,
    role,
  };
}

function isVendorStatus(v: string): v is VendorStatus {
  return (VENDOR_STATUSES as readonly string[]).includes(v);
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

function parseForm(formData: FormData): {
  ok: true;
  data: {
    name: string;
    displayName: string;
    email: string;
    phone: string;
    contactPerson: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    gstin: string;
    pan: string;
    status: VendorStatus;
    notes: string;
  };
} | { ok: false; errors: NonNullable<VendorActionState["errors"]> } {
  const errors: NonNullable<VendorActionState["errors"]> = {};

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  if (!name) errors.name = "Name is required.";
  if (name.length > 160) errors.name = "Name is too long (max 160).";

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "Enter a valid email.";

  const phone = (formData.get("phone") as string | null)?.trim() ?? "";
  if (phone.length > 40) errors.phone = "Phone is too long.";

  const statusRaw = (formData.get("status") as string | null) ?? "active";
  if (!isVendorStatus(statusRaw)) errors.status = "Pick a status.";

  const gstin = ((formData.get("gstin") as string | null) ?? "")
    .trim()
    .toUpperCase();
  if (gstin && !GSTIN_RE.test(gstin)) {
    errors.gstin = "GSTIN format looks wrong.";
  }

  const pan = ((formData.get("pan") as string | null) ?? "").trim().toUpperCase();
  if (pan && !PAN_RE.test(pan)) {
    errors.pan = "PAN format looks wrong.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      displayName: (formData.get("displayName") as string | null)?.trim() ?? "",
      email,
      phone,
      contactPerson:
        (formData.get("contactPerson") as string | null)?.trim() ?? "",
      line1: (formData.get("line1") as string | null)?.trim() ?? "",
      line2: (formData.get("line2") as string | null)?.trim() ?? "",
      city: (formData.get("city") as string | null)?.trim() ?? "",
      state: (formData.get("state") as string | null)?.trim() ?? "",
      country: (formData.get("country") as string | null)?.trim() ?? "",
      postalCode:
        (formData.get("postalCode") as string | null)?.trim() ?? "",
      gstin,
      pan,
      status: statusRaw as VendorStatus,
      notes: ((formData.get("notes") as string | null) ?? "").trim().slice(0, 4000),
    },
  };
}

export async function createVendor(
  workspaceId: string,
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManageVendors(ctx.role)) {
    return { formError: "You don't have permission to add vendors." };
  }

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  try {
    await Vendor.create({
      workspace: workspaceId,
      name: d.name,
      displayName: d.displayName,
      email: d.email || null,
      phone: d.phone || null,
      contactPerson: d.contactPerson,
      address: {
        line1: d.line1,
        line2: d.line2,
        city: d.city,
        state: d.state,
        country: d.country,
        postalCode: d.postalCode,
      },
      gstin: d.gstin,
      pan: d.pan,
      status: d.status,
      notes: d.notes,
      createdBy: ctx.session.user.id,
    });
  } catch (err) {
    console.error("[createVendor] failed", err);
    return { formError: "Couldn't create the vendor. Please try again." };
  }

  revalidatePath(`/workspace/${workspaceId}/vendors`);
  redirect(`/workspace/${workspaceId}/vendors`);
}

export async function updateVendor(
  workspaceId: string,
  vendorId: string,
  _prev: VendorActionState,
  formData: FormData,
): Promise<VendorActionState> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { formError: ctx.error };
  if (!canManageVendors(ctx.role)) {
    return { formError: "You don't have permission to edit vendors." };
  }
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return { formError: "Invalid vendor id." };
  }

  const existing = await Vendor.findOne({
    _id: vendorId,
    workspace: workspaceId,
  });
  if (!existing) return { formError: "Vendor not found." };

  const parsed = parseForm(formData);
  if (!parsed.ok) return { errors: parsed.errors };
  const d = parsed.data;

  existing.name = d.name;
  existing.displayName = d.displayName;
  existing.email = d.email || null;
  existing.phone = d.phone || null;
  existing.contactPerson = d.contactPerson;
  existing.address = {
    line1: d.line1,
    line2: d.line2,
    city: d.city,
    state: d.state,
    country: d.country,
    postalCode: d.postalCode,
  } as typeof existing.address;
  existing.gstin = d.gstin;
  existing.pan = d.pan;
  existing.status = d.status;
  existing.notes = d.notes;

  try {
    await existing.save();
  } catch (err) {
    console.error("[updateVendor] failed", err);
    return { formError: "Couldn't save the vendor. Please try again." };
  }

  revalidatePath(`/workspace/${workspaceId}/vendors`);
  revalidatePath(`/workspace/${workspaceId}/vendors/${vendorId}/edit`);
  redirect(`/workspace/${workspaceId}/vendors`);
}

export async function deleteVendor(
  workspaceId: string,
  vendorId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = await loadContext(workspaceId);
  if (!ctx.ok) return { ok: false, error: ctx.error };
  if (!canManageVendors(ctx.role)) {
    return { ok: false, error: "You can't delete vendors." };
  }
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    return { ok: false, error: "Invalid vendor id." };
  }

  const filter = { workspace: workspaceId, "vendor.refId": vendorId };
  const [purchaseOrders, purchaseInvoices, payments] = await Promise.all([
    PurchaseOrder.countDocuments(filter),
    PurchaseInvoice.countDocuments(filter),
    Payment.countDocuments(filter),
  ]);
  const linked: string[] = [];
  if (purchaseOrders > 0) {
    linked.push(`${purchaseOrders} purchase order${purchaseOrders === 1 ? "" : "s"}`);
  }
  if (purchaseInvoices > 0) {
    linked.push(`${purchaseInvoices} purchase invoice${purchaseInvoices === 1 ? "" : "s"}`);
  }
  if (payments > 0) {
    linked.push(`${payments} payment${payments === 1 ? "" : "s"}`);
  }
  if (linked.length > 0) {
    return {
      ok: false,
      error: `Can't remove this vendor — it's linked to ${linked.join(", ")}.`,
    };
  }

  await Vendor.deleteOne({ _id: vendorId, workspace: workspaceId });
  revalidatePath(`/workspace/${workspaceId}/vendors`);
  return { ok: true };
}
