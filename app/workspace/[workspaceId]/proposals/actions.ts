"use server";

import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { auth } from "@/config/auth";
import { connectDB } from "@/config/db";
import Workspace from "@/models/workspace";
import ProposalChat from "@/models/proposal-chat";
import { getActorRole } from "@/lib/workspace-access";
import type { UserRole } from "@/lib/user";
import {
  PROPOSAL_DOCUMENT_VERSION,
  runProposalAssistant,
  type ProposalDocument,
} from "@/lib/proposal-ai";
import type { ClaudeMessage } from "@/lib/claude";
import {
  serializeChat,
  type ChatDocLike,
  type SerializedProposalChat,
  type SerializedProposalMessage,
} from "./_lib/serialize";

const ALLOWED_ROLES: ReadonlyArray<UserRole> = [
  "owner",
  "admin",
  "sales_manager",
  "sales_executive",
];

function canUseProposals(role: UserRole): boolean {
  return ALLOWED_ROLES.includes(role);
}

function buildTitleFromText(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New proposal";
  return trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed;
}

function buildPreview(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
}

async function loadWorkspaceForActor(workspaceId: string) {
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

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return { ok: false as const, error: "Workspace not found." };
  }

  const role = getActorRole(workspace, session.user.id);
  if (!canUseProposals(role)) {
    return {
      ok: false as const,
      error: "You don't have permission to use the proposal assistant.",
    };
  }

  return { ok: true as const, session, workspace, role };
}

type SendProposalMessageResult =
  | {
      ok: true;
      chat: SerializedProposalChat;
      assistantMessage: SerializedProposalMessage;
    }
  | { ok: false; error: string };

export async function sendProposalMessage(
  workspaceId: string,
  chatId: string | null,
  text: string,
): Promise<SendProposalMessageResult> {
  const ctx = await loadWorkspaceForActor(workspaceId);
  if (!ctx.ok) return ctx;
  const { session, workspace } = ctx;

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Message can't be empty." };
  if (trimmed.length > 8000)
    return { ok: false, error: "Message is too long (max 8000 chars)." };

  // Load or create the chat
  let chat: Awaited<ReturnType<typeof ProposalChat.findOne>> | null = null;
  if (chatId) {
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return { ok: false, error: "Invalid chat id." };
    }
    chat = await ProposalChat.findOne({
      _id: chatId,
      workspace: workspaceId,
      createdBy: session.user.id,
    });
    if (!chat) return { ok: false, error: "Chat not found." };
  } else {
    chat = await ProposalChat.create({
      workspace: workspaceId,
      createdBy: session.user.id,
      title: buildTitleFromText(trimmed),
      messages: [],
      lastMessagePreview: "",
    });
  }

  const now = new Date();

  // Push the user message first, persist immediately so we don't lose it if
  // the model call fails.
  chat.messages.push({
    role: "user",
    content: trimmed,
    proposal: null,
    attachments: [],
    createdAt: now,
  } as unknown as (typeof chat.messages)[number]);
  chat.lastMessagePreview = buildPreview(trimmed);
  await chat.save();

  // Build the Claude history from the persisted thread so the model sees the
  // full conversation, not just the latest turn.
  const history: ClaudeMessage[] = chat.messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as ClaudeMessage["role"],
      content: m.content,
    }));

  const preparedByName =
    session.user.name?.trim() || session.user.email || "Sales team";

  let assistantText = "";
  let proposal: ProposalDocument | null = null;
  try {
    const result = await runProposalAssistant({
      workspaceName: workspace.name,
      preparedByName,
      history,
    });
    assistantText = result.text;
    proposal = result.proposal;
  } catch (err) {
    console.error("[sendProposalMessage] AI call failed", err);
    return {
      ok: false,
      error:
        err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
          ? "Claude API key is not configured."
          : "The assistant couldn't respond. Please try again.",
    };
  }

  const assistantMessage = {
    role: "assistant" as const,
    content:
      assistantText ||
      (proposal
        ? "Proposal generated — preview is rendering in the panel."
        : "(no response)"),
    proposal: proposal
      ? { version: PROPOSAL_DOCUMENT_VERSION, payload: proposal }
      : null,
    attachments: [],
    createdAt: new Date(),
  };

  chat.messages.push(
    assistantMessage as unknown as (typeof chat.messages)[number],
  );
  chat.lastMessagePreview = buildPreview(assistantMessage.content);
  await chat.save();

  // Refresh the rail's chat list (layout query) and, if this was an existing
  // chat, its detail page so the server-rendered messages stay in sync.
  revalidatePath(`/workspace/${workspaceId}/proposals`);
  revalidatePath(`/workspace/${workspaceId}/proposals/chat/${chat._id}`);

  const serialized = serializeChat(chat as unknown as ChatDocLike);
  const newAssistant = serialized.messages[serialized.messages.length - 1];

  return { ok: true, chat: serialized, assistantMessage: newAssistant };
}

type DeleteProposalChatResult =
  | { ok: true }
  | { ok: false; error: string };

export async function deleteProposalChat(
  workspaceId: string,
  chatId: string,
): Promise<DeleteProposalChatResult> {
  const ctx = await loadWorkspaceForActor(workspaceId);
  if (!ctx.ok) return ctx;

  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return { ok: false, error: "Invalid chat id." };
  }

  const result = await ProposalChat.deleteOne({
    _id: chatId,
    workspace: workspaceId,
    createdBy: ctx.session.user.id,
  });
  if (result.deletedCount === 0) {
    return { ok: false, error: "Chat not found." };
  }

  revalidatePath(`/workspace/${workspaceId}/proposals`);
  return { ok: true };
}
