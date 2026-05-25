"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Company from "@/models/company";
import Workspace from "@/models/workspace";
import { canManageCompany } from "@/lib/company";
import { getActorRole } from "@/lib/workspace-access";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^[0-9A-Z]{15}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export type CompanyFormErrors = Partial<
  Record<"legalName" | "email" | "gstin" | "pan", string>
>;

export type CompanyActionState =
  | {
      ok?: boolean;
      errors?: CompanyFormErrors;
      formError?: string;
    }
  | undefined;

type ParsedCompanyInput = {
  legalName: string;
  displayName: string;
  email: string;
  phone: string;
  website: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstin: string;
  pan: string;
  cin: string;
  taxId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
};

function parseCompanyForm(formData: FormData): {
  data?: ParsedCompanyInput;
  errors?: CompanyFormErrors;
} {
  const get = (key: string) => String(formData.get(key) ?? "").trim();

  const legalName = get("legalName");
  const email = get("email").toLowerCase();
  const gstin = get("gstin").toUpperCase();
  const pan = get("pan").toUpperCase();

  const errors: CompanyFormErrors = {};
  if (legalName.length < 2) errors.legalName = "Please enter the company name.";
  if (email && !EMAIL_RE.test(email))
    errors.email = "Please enter a valid email.";
  if (gstin && !GSTIN_RE.test(gstin))
    errors.gstin = "GSTIN must be 15 alphanumeric characters.";
  if (pan && !PAN_RE.test(pan)) errors.pan = "PAN must look like ABCDE1234F.";

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      legalName,
      displayName: get("displayName"),
      email,
      phone: get("phone"),
      website: get("website"),
      line1: get("line1"),
      line2: get("line2"),
      city: get("city"),
      state: get("state"),
      country: get("country"),
      postalCode: get("postalCode"),
      gstin,
      pan,
      cin: get("cin").toUpperCase(),
      taxId: get("taxId"),
      bankName: get("bankName"),
      accountName: get("accountName"),
      accountNumber: get("accountNumber"),
      ifsc: get("ifsc").toUpperCase(),
      branch: get("branch"),
      upiId: get("upiId"),
    },
  };
}

export async function saveCompanyDetails(
  workspaceId: string,
  _prev: CompanyActionState,
  formData: FormData,
): Promise<CompanyActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { formError: "Your session expired. Please sign in again." };
  }

  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { formError: "Invalid workspace." };
  }

  const parsed = parseCompanyForm(formData);
  if (parsed.errors) return { errors: parsed.errors };
  const data = parsed.data!;

  await connectDB();

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return { formError: "Workspace not found." };

  const actorRole = getActorRole(workspace, session.user.id);
  if (!canManageCompany(actorRole)) {
    return {
      formError: "You don't have permission to edit company details.",
    };
  }

  const fields = {
    legalName: data.legalName,
    displayName: data.displayName,
    email: data.email,
    phone: data.phone,
    website: data.website,
    address: {
      line1: data.line1,
      line2: data.line2,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode,
    },
    gstin: data.gstin,
    pan: data.pan,
    cin: data.cin,
    taxId: data.taxId,
    bank: {
      bankName: data.bankName,
      accountName: data.accountName,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc,
      branch: data.branch,
      upiId: data.upiId,
    },
    updatedBy: session.user.id,
  };

  try {
    await Company.findOneAndUpdate(
      { workspace: workspaceId },
      { $set: fields, $setOnInsert: { workspace: workspaceId } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  } catch (err) {
    console.error("[saveCompanyDetails] failed", err);
    const message =
      err instanceof Error ? err.message : "Couldn't save company details.";
    return { formError: `${message} Please try again.` };
  }

  revalidatePath(`/workspace/${workspaceId}/company-details`);
  return { ok: true };
}
