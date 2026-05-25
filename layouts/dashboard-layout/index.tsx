import type { ReactNode } from "react";
import type { WorkspaceColor } from "@/lib/workspace";
import type { UserRole } from "@/lib/user";
import { cn } from "@/lib/cn";
import Header from "./header";
import Sidebar from "./sidebar";
import type { NavConfig } from "./nav";

type DashboardLayoutProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  workspace: {
    id: string;
    name: string;
    color: WorkspaceColor;
    role: UserRole;
  };
  // Override the default workspace sidebar menu — e.g. the project-scoped menu
  // shown while viewing a single project. Plain/serializable so it can cross
  // the Server → Client boundary into the sidebar components.
  nav?: NavConfig;
  compactSidebar?: boolean;
  fullBleed?: boolean;
  children: ReactNode;
};

export default function DashboardLayout({
  user,
  workspace,
  nav,
  compactSidebar = false,
  fullBleed = false,
  children,
}: DashboardLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100",
        fullBleed
          ? "fixed inset-0 h-screen w-screen overflow-hidden"
          : "min-h-screen flex-1",
      )}
    >
      <Header user={user} workspace={workspace} nav={nav} />
      <div className={cn("flex flex-1", fullBleed && "min-h-0")}>
        <Sidebar
          workspaceId={workspace.id}
          role={workspace.role}
          compact={compactSidebar}
          nav={nav}
        />
        <main
          className={cn(
            "flex flex-1 flex-col",
            fullBleed ? "min-h-0 min-w-0" : "px-4 py-6 sm:px-6 lg:px-8",
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
