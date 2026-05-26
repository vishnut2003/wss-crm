import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/config/auth";

function getAllowedEmails(): string[] {
  return (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

export function isPlatformAdminEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return getAllowedEmails().includes(email.toLowerCase());
}

export type PlatformAdminAccess = {
  session: Session & {
    user: NonNullable<Session["user"]> & { id: string; email: string };
  };
};

// Gate for /admin routes. Unauthenticated → /login. Signed-in but not on the
// allowlist → 404 (so the route appears not to exist at all).
export async function requirePlatformAdmin(): Promise<PlatformAdminAccess> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) redirect("/login");
  if (!isPlatformAdminEmail(session.user.email)) notFound();
  return { session: session as PlatformAdminAccess["session"] };
}
