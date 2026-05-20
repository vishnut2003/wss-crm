import Link from "next/link";
import { FileText, MessageSquarePlus, Sparkles } from "lucide-react";
import { timeAgo } from "@/lib/time";
import type { SerializedProposalChat } from "../_lib/serialize";

type Props = {
  workspaceId: string;
  conversations: SerializedProposalChat[];
};

export default function ChatList({ workspaceId, conversations }: Props) {
  const base = `/workspace/${workspaceId}/proposals`;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Proposal chats
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">
            Your drafts with the proposal assistant. Each chat can render its
            own PDF when you&rsquo;re ready.
          </p>
        </div>
        <Link
          href={`${base}/new`}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-zinc-900 px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-950/30">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <Sparkles className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-[16px] font-medium text-zinc-900 dark:text-zinc-100">
            No proposal chats yet
          </h2>
          <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Start your first proposal. Describe the client and scope; the
            assistant will draft it and render a PDF.
          </p>
          <Link
            href={`${base}/new`}
            className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-zinc-900 px-4 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <MessageSquarePlus className="h-4 w-4" />
            Start your first proposal
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {conversations.map((c) => (
            <Link
              key={c.id}
              href={`${base}/chat/${c.id}`}
              className="group relative flex h-full flex-col rounded-2xl border border-zinc-200/80 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-[0_8px_28px_-12px_rgba(24,24,27,0.14)] dark:border-zinc-800/70 dark:bg-zinc-950/40 dark:hover:border-zinc-700"
            >
              <div className="flex items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-zinc-900 dark:text-zinc-100">
                    {c.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                    Updated {timeAgo(new Date(c.updatedAt))}
                  </p>
                </div>
              </div>
              {c.preview ? (
                <p className="mt-3 line-clamp-3 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {c.preview}
                </p>
              ) : (
                <p className="mt-3 text-[12.5px] italic text-zinc-400 dark:text-zinc-500">
                  No messages yet
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
