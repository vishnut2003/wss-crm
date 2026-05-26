"use server";

import mongoose from "mongoose";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import Customer from "@/models/customer";
import Vendor from "@/models/vendor";
import { getActorRole } from "@/lib/workspace-access";
import {
  canViewPurchases,
  canViewVouchers,
  escapeRegex,
  type PartyKind,
  type PartyResult,
} from "@/lib/voucher";

// Single search action used by every voucher's PartyPicker. `kind` decides
// whether we search Customers (sales-side) or Vendors (purchase-side).
export async function searchParties(
  workspaceId: string,
  kind: PartyKind,
  query: string,
): Promise<
  { ok: true; results: PartyResult[] } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Your session expired. Please sign in again." };
  }
  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { ok: false, error: "Invalid workspace." };
  }

  await connectDB();
  const workspaceDoc = await Workspace.findById(workspaceId);
  if (!workspaceDoc) return { ok: false, error: "Workspace not found." };

  const role = getActorRole(workspaceDoc, session.user.id);

  if (kind === "customer" && !canViewVouchers(role)) {
    return { ok: false, error: "You don't have access to customers here." };
  }
  if (kind === "vendor" && !canViewPurchases(role)) {
    return { ok: false, error: "You don't have access to vendors here." };
  }

  const trimmed = query.trim();
  if (trimmed.length > 60) return { ok: true, results: [] };

  // Sales executives only see customers assigned to them. Accounts / admin /
  // owner see all.
  const baseFilter: Record<string, unknown> = { workspace: workspaceId };
  if (kind === "customer" && role === "sales_executive") {
    baseFilter.assignedTo = session.user.id;
  }
  if (kind === "vendor") {
    // Hide inactive vendors from the picker by default.
    baseFilter.status = "active";
  }

  const filter = trimmed
    ? {
        ...baseFilter,
        $or: [
          { name: new RegExp(escapeRegex(trimmed), "i") },
          { company: new RegExp(escapeRegex(trimmed), "i") },
          { displayName: new RegExp(escapeRegex(trimmed), "i") },
          { email: new RegExp(escapeRegex(trimmed), "i") },
          { gstin: new RegExp(escapeRegex(trimmed), "i") },
        ],
      }
    : baseFilter;

  type Row = {
    _id: mongoose.Types.ObjectId;
    name: string;
    company?: string;
    displayName?: string;
    email?: string | null;
    gstin?: string;
  };

  // Split the query per kind — TypeScript can't unify the `find` signatures
  // across Customer and Vendor because their schemas differ. The post-query
  // shape is identical, so we collapse to a single `Row[]`.
  const rows =
    kind === "customer"
      ? ((await Customer.find(filter)
          .select({ name: 1, company: 1, displayName: 1, email: 1, gstin: 1 })
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean()
          .exec()) as unknown as Row[])
      : ((await Vendor.find(filter)
          .select({ name: 1, company: 1, displayName: 1, email: 1, gstin: 1 })
          .sort({ updatedAt: -1 })
          .limit(20)
          .lean()
          .exec()) as unknown as Row[]);

  const results: PartyResult[] = rows.map((r) => ({
    kind,
    id: String(r._id),
    name: r.name,
    company:
      kind === "vendor" ? (r.displayName ?? r.company ?? "") : (r.company ?? ""),
    email: r.email ?? "",
    gstin: r.gstin ?? "",
  }));

  return { ok: true, results };
}
