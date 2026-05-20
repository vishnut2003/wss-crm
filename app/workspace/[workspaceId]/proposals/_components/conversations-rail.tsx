"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText, MessageSquarePlus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { deleteProposalChat } from "../actions";
import type { SerializedProposalChat } from "../_lib/serialize";
import { useRail } from "./proposals-chat-shell";

type Props = {
  workspaceId: string;
  conversations: SerializedProposalChat[];
};

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function activeChatIdFromPath(
  pathname: string,
  workspaceId: string,
): string | null {
  const prefix = `/workspace/${workspaceId}/proposals/chat/`;
  if (!pathname.startsWith(prefix)) return null;
  const tail = pathname.slice(prefix.length);
  const id = tail.split("/")[0] ?? "";
  return id.length > 0 ? id : null;
}

export default function ConversationsRail({
  workspaceId,
  conversations,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isRailOpen, setIsRailOpen } = useRail();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [isRailExpanded, setIsRailExpanded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const railEnterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const railLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleRailEnter = () => {
    if (railLeaveTimerRef.current) {
      clearTimeout(railLeaveTimerRef.current);
      railLeaveTimerRef.current = null;
    }
    if (isRailExpanded) return;
    railEnterTimerRef.current = setTimeout(() => setIsRailExpanded(true), 200);
  };

  const handleRailLeave = () => {
    if (railEnterTimerRef.current) {
      clearTimeout(railEnterTimerRef.current);
      railEnterTimerRef.current = null;
    }
    if (!isRailExpanded) return;
    railLeaveTimerRef.current = setTimeout(() => setIsRailExpanded(false), 350);
  };

  useEffect(() => {
    return () => {
      if (railEnterTimerRef.current) clearTimeout(railEnterTimerRef.current);
      if (railLeaveTimerRef.current) clearTimeout(railLeaveTimerRef.current);
    };
  }, []);

  const activeId = activeChatIdFromPath(pathname, workspaceId);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  function startNewChat() {
    setIsRailOpen(false);
    router.push(`/workspace/${workspaceId}/proposals/new`);
  }

  function selectChat(id: string) {
    setIsRailOpen(false);
    router.push(`/workspace/${workspaceId}/proposals/chat/${id}`);
  }

  function handleDelete(id: string) {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteProposalChat(workspaceId, id);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }
      if (id === activeId) {
        router.push(`/workspace/${workspaceId}/proposals/new`);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <aside
      data-expanded={isRailExpanded || isRailOpen ? "" : undefined}
      onMouseEnter={handleRailEnter}
      onMouseLeave={handleRailLeave}
      className={cn(
        "group/rail absolute left-0 top-0 z-20 h-full w-14 flex-col overflow-hidden border-r border-zinc-100/80 bg-zinc-50/80 backdrop-blur-sm transition-[width,box-shadow] duration-200 ease-out data-[expanded]:w-72 data-[expanded]:shadow-xl data-[expanded]:shadow-zinc-900/5 dark:border-zinc-800/70 dark:bg-zinc-950/80 dark:data-[expanded]:shadow-black/30",
        isRailOpen ? "flex" : "hidden md:flex",
      )}
    >
      <div className="space-y-2 px-2 pb-2 pt-3 group-data-[expanded]/rail:px-3">
        <button
          type="button"
          onClick={startNewChat}
          title="New chat"
          className="group/new inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-zinc-200/70 bg-white px-2 text-[12.5px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800/70 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/60"
        >
          <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden whitespace-nowrap group-data-[expanded]/rail:inline">
            New chat
          </span>
        </button>

        <div className="relative hidden group-data-[expanded]/rail:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="h-8 w-full rounded-lg border border-transparent bg-zinc-100/80 pl-8 pr-2.5 text-[12.5px] text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-zinc-300 focus:bg-white dark:bg-zinc-900/60 dark:text-zinc-100 dark:focus:border-zinc-700 dark:focus:bg-zinc-900"
          />
        </div>
      </div>

      <p className="hidden px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 group-data-[expanded]/rail:block dark:text-zinc-500">
        Conversations
      </p>

      <div className="rail-scroll flex-1 overflow-y-auto px-1.5 pb-3 group-data-[expanded]/rail:px-2">
        {filtered.length === 0 ? (
          <div className="mx-2 mt-4 hidden rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-[12px] text-zinc-500 group-data-[expanded]/rail:block dark:border-zinc-800 dark:text-zinc-400">
            {query
              ? "No chats match that search."
              : "No conversations yet. Start one with the button above."}
          </div>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((convo) => {
              const isActive = convo.id === activeId;
              return (
                <li key={convo.id}>
                  <button
                    type="button"
                    onClick={() => selectChat(convo.id)}
                    title={convo.title}
                    className={cn(
                      "group/item relative flex w-full items-center justify-center gap-2 rounded-lg px-1.5 py-2 text-left transition-colors group-data-[expanded]/rail:items-center group-data-[expanded]/rail:justify-start group-data-[expanded]/rail:gap-2.5 group-data-[expanded]/rail:px-2.5",
                      isActive
                        ? "bg-zinc-200/60 text-zinc-900 dark:bg-zinc-800/70 dark:text-zinc-100"
                        : "text-zinc-600 hover:bg-zinc-200/40 dark:text-zinc-400 dark:hover:bg-zinc-800/40",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-md transition-colors",
                        isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-transparent text-zinc-400 dark:text-zinc-500",
                      )}
                    >
                      <FileText className="h-3 w-3" />
                    </span>
                    <span className="hidden min-w-0 flex-1 group-data-[expanded]/rail:block">
                      <span
                        className={cn(
                          "block truncate text-[12.5px]",
                          isActive ? "font-medium" : "font-normal",
                        )}
                      >
                        {convo.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                        {convo.preview}
                      </span>
                    </span>
                    <span className="ml-auto hidden shrink-0 items-center gap-1.5 group-data-[expanded]/rail:flex">
                      <span className="text-[10px] text-zinc-400 transition-opacity group-hover/item:opacity-0 dark:text-zinc-500">
                        {formatRelative(convo.updatedAt)}
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Delete ${convo.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(convo.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(convo.id);
                          }
                        }}
                        className="absolute right-2 grid h-5 w-5 cursor-pointer place-items-center rounded text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-300/60 hover:text-rose-500 group-hover/item:opacity-100 dark:hover:bg-zinc-700/60"
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {errorMessage ? (
        <div className="hidden border-t border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700 group-data-[expanded]/rail:block dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          {errorMessage}
        </div>
      ) : null}
    </aside>
  );
}
