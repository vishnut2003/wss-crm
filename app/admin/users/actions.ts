"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/config/db";
import User from "@/models/user";
import { isPlatformAdminEmail, requirePlatformAdmin } from "@/lib/platform-admin";

export type SetUserDisabledResult = { ok: true } | { ok: false; error: string };

export async function setUserDisabled(
  userId: string,
  disabled: boolean,
): Promise<SetUserDisabledResult> {
  const { session } = await requirePlatformAdmin();

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ok: false, error: "Invalid user." };
  }
  if (disabled && userId === session.user.id) {
    return { ok: false, error: "You can't disable your own account." };
  }

  await connectDB();
  const user = await User.findById(userId).select("email disabled");
  if (!user) {
    return { ok: false, error: "User not found." };
  }
  // Never lock out a platform admin via this control.
  if (disabled && isPlatformAdminEmail(user.email)) {
    return { ok: false, error: "Platform admins can't be disabled here." };
  }

  user.disabled = disabled;
  await user.save();

  revalidatePath("/admin/users");
  return { ok: true };
}
