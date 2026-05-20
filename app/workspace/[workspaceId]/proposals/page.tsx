import type { Metadata } from "next";
import mongoose from "mongoose";
import type { WorkspaceColor } from "@/lib/workspace";
import { requireWorkspaceAccess } from "@/lib/workspace-access";
import DashboardLayout from "@/layouts/dashboard-layout";
import ProposalChat from "@/models/proposal-chat";
import type { ProposalDocument } from "@/lib/proposal-ai";
import ProposalsChat, {
  type SerializedProposalChat,
} from "./_components/proposals-chat";

export const metadata: Metadata = {
  title: "Proposals — WSS CRM",
};

type ProposalsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

type ChatDocLike = {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  title: string;
  lastMessagePreview?: string;
  messages: Array<{
    _id?: mongoose.Types.ObjectId;
    role: "user" | "assistant";
    content: string;
    proposal?: { version: number; payload: unknown } | null;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

function serializeChat(doc: ChatDocLike): SerializedProposalChat {
  return {
    id: String(doc._id),
    workspaceId: String(doc.workspace),
    title: doc.title,
    preview: doc.lastMessagePreview ?? "",
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    messages: doc.messages.map((m, idx) => ({
      id: m._id ? String(m._id) : `${String(doc._id)}-${idx}`,
      role: m.role,
      content: m.content,
      proposal: m.proposal?.payload
        ? (m.proposal.payload as ProposalDocument)
        : null,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export default async function ProposalsPage({ params }: ProposalsPageProps) {
  const { workspaceId } = await params;

  const { session, workspace: doc, role } = await requireWorkspaceAccess({
    workspaceId,
    allowedRoles: ["owner", "admin", "sales_manager", "sales_executive"],
  });

  const workspace = {
    id: String(doc._id),
    name: doc.name,
    color: doc.color as WorkspaceColor,
    role,
  };

  const chats = (await ProposalChat.find({
    workspace: workspaceId,
    createdBy: session.user.id,
  })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean()) as unknown as ChatDocLike[];

  const conversations = chats.map(serializeChat);

  const userInitial =
    (session.user.name ?? session.user.email ?? "you")
      .trim()
      .charAt(0)
      .toUpperCase() || "?";

  return (
    <DashboardLayout
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
      workspace={workspace}
      compactSidebar
      fullBleed
    >
      <ProposalsChat
        workspaceId={workspace.id}
        conversations={conversations}
        userImage={session.user.image ?? null}
        userInitial={userInitial}
        workspaceName={workspace.name}
      />
    </DashboardLayout>
  );
}
