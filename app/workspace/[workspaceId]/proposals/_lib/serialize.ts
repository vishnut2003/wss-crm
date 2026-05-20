import type mongoose from "mongoose";
import type { ProposalDocument } from "@/lib/proposal-ai";

export type ChatRole = "user" | "assistant";

export type SerializedProposalMessage = {
  id: string;
  role: ChatRole;
  content: string;
  proposal: ProposalDocument | null;
  createdAt: string;
};

export type SerializedProposalChat = {
  id: string;
  workspaceId: string;
  title: string;
  preview: string;
  updatedAt: string;
  createdAt: string;
  messages: SerializedProposalMessage[];
};

export type ChatDocLike = {
  _id: mongoose.Types.ObjectId;
  workspace: mongoose.Types.ObjectId;
  title: string;
  lastMessagePreview?: string;
  messages: Array<{
    _id?: mongoose.Types.ObjectId;
    role: ChatRole;
    content: string;
    proposal?: { version: number; payload: unknown } | null;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeChat(doc: ChatDocLike): SerializedProposalChat {
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
