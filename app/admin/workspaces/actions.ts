"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { WORKSPACE_STATUSES, type WorkspaceStatus } from "@/lib/workspace";

export type SetWorkspaceStatusResult = { ok: true } | { ok: false; error: string };

function isWorkspaceStatus(value: string): value is WorkspaceStatus {
  return (WORKSPACE_STATUSES as readonly string[]).includes(value);
}

export async function setWorkspaceStatus(
  workspaceId: string,
  status: string,
): Promise<SetWorkspaceStatusResult> {
  await requirePlatformAdmin();

  if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
    return { ok: false, error: "Invalid workspace." };
  }
  if (!isWorkspaceStatus(status)) {
    return { ok: false, error: "Invalid status." };
  }

  await connectDB();
  const result = await Workspace.updateOne(
    { _id: workspaceId },
    { $set: { status } },
  );
  if (result.matchedCount === 0) {
    return { ok: false, error: "Workspace not found." };
  }

  revalidatePath("/admin/workspaces");
  return { ok: true };
}
