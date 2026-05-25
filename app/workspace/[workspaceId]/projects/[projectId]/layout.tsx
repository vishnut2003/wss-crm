import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import mongoose from "mongoose";
import { FolderKanban } from "lucide-react";
import Project from "@/models/project";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import {
  PROJECT_STATUS_BADGE_CLASS,
  PROJECT_STATUS_DOT_CLASS,
  PROJECT_STATUS_LABEL,
  PROJECT_VIEWER_ROLES,
  canViewAllProjects,
  type ProjectStatus,
} from "@/lib/project";
import type { WorkspaceColor } from "@/lib/workspace";
import { cn } from "@/lib/cn";
import DashboardLayout from "@/layouts/dashboard-layout";

type LeanProject = {
  name: string;
  status: ProjectStatus;
  team: Array<{ toString(): string }>;
};

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ workspaceId: string; projectId: string }>;
}) {
  const { workspaceId, projectId } = await params;

  if (!mongoose.Types.ObjectId.isValid(projectId)) notFound();

  const {
    session,
    workspace: doc,
    role,
  } = await requireWorkspaceAccess({
    workspaceId,
    allowedRoles: [...PROJECT_VIEWER_ROLES],
  });

  const project = (await Project.findOne({
    _id: projectId,
    workspace: workspaceId,
  })
    .select("name status team")
    .lean()) as LeanProject | null;

  if (!project) notFound();

  // Team members can only open projects they're on; everyone else sees all.
  if (!canViewAllProjects(role)) {
    const onTeam = (project.team ?? []).some(
      (t) => String(t) === session.user.id,
    );
    if (!onTeam) notFound();
  }

  const workspace = {
    id: String(doc._id),
    name: doc.name,
    color: doc.color as WorkspaceColor,
    role,
  };

  const status = project.status;

  return (
    <DashboardLayout
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      workspace={workspace}
      nav={{ type: "project", projectId }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Project header — shared across every project sub-page */}
        <div className="mb-6 flex flex-wrap items-center gap-3.5">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
            />
            <FolderKanban className="relative h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
              Project
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2.5">
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-white">
                {project.name}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                  PROJECT_STATUS_BADGE_CLASS[status],
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    PROJECT_STATUS_DOT_CLASS[status],
                  )}
                />
                {PROJECT_STATUS_LABEL[status]}
              </span>
            </div>
          </div>
        </div>

        {children}
      </div>
    </DashboardLayout>
  );
}
