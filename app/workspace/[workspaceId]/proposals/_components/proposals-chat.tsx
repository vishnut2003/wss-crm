"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  ArrowUp,
  FileText,
  FileUp,
  MessageSquarePlus,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  body: string;
};

export type ProposalConversation = {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type ProposalsChatProps = {
  conversations: ProposalConversation[];
  userName: string;
  userImage: string | null;
  userInitial: string;
  workspaceName: string;
};

const suggestionPrompts = [
  "Draft a SaaS onboarding proposal for Acme",
  "Create a retainer proposal with monthly milestones",
  "Compare 3 pricing tiers in a feature matrix",
  "Outline a discovery-to-launch timeline",
];

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function assistantReplyFor(prompt: string): string {
  const trimmed = prompt.trim();
  if (!trimmed) return "Could you share a few more details about the proposal?";
  return `Here's a starting draft for "${trimmed}":\n\n1. Executive summary — frame the client's goal and our approach\n2. Scope of work — concrete deliverables, dependencies, and out-of-scope items\n3. Timeline & milestones — weekly cadence with review gates\n4. Investment — pricing, payment terms, and any add-ons\n5. Next steps — sign-off, kickoff date, and stakeholders\n\nTell me which section to expand and I'll go deeper.`;
}

export default function ProposalsChat({
  conversations: initialConversations,
  userName,
  userImage,
  userInitial,
  workspaceName,
}: ProposalsChatProps) {
  const [conversations, setConversations] = useState<ProposalConversation[]>(
    initialConversations,
  );
  const [activeId, setActiveId] = useState<string | null>(
    initialConversations[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [pdfWidth, setPdfWidth] = useState(40);
  const [isPdfOpen, setIsPdfOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isResizingPdf = useRef(false);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.preview.toLowerCase().includes(q),
    );
  }, [conversations, query]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, isThinking, activeId]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    function onMove(e: globalThis.MouseEvent) {
      if (!isResizingPdf.current) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0) return;
      const pxFromRight = rect.right - e.clientX;
      const percent = (pxFromRight / rect.width) * 100;
      setPdfWidth(Math.max(20, Math.min(70, percent)));
    }
    function onUp() {
      if (!isResizingPdf.current) return;
      isResizingPdf.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function startPdfResize(e: ReactMouseEvent<HTMLDivElement>) {
    e.preventDefault();
    isResizingPdf.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function startNewChat() {
    const id = makeId();
    const fresh: ProposalConversation = {
      id,
      title: "New proposal",
      preview: "Tell the assistant what you'd like to draft.",
      updatedAt: "Just now",
      messages: [
        {
          id: makeId(),
          role: "assistant",
          body: `Hi ${userName.split(" ")[0] ?? ""}! I can help you draft a proposal for ${workspaceName}. What client and engagement type are we working with?`,
        },
      ],
    };
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(id);
    setInput("");
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (id === activeId) {
        setActiveId(next[0]?.id ?? null);
      }
      return next;
    });
  }

  function sendMessage(rawText: string) {
    const text = rawText.trim();
    if (!text) return;

    let convoId = activeId;
    let userTitle: string | null = null;

    setConversations((prev) => {
      let list = prev;
      if (!convoId) {
        convoId = makeId();
        userTitle = text.length > 48 ? `${text.slice(0, 48)}…` : text;
        const fresh: ProposalConversation = {
          id: convoId,
          title: userTitle,
          preview: text,
          updatedAt: "Just now",
          messages: [],
        };
        list = [fresh, ...prev];
      }
      const userMsg: ChatMessage = {
        id: makeId(),
        role: "user",
        body: text,
      };
      return list.map((c) =>
        c.id === convoId
          ? {
              ...c,
              title:
                c.title === "New proposal"
                  ? text.length > 48
                    ? `${text.slice(0, 48)}…`
                    : text
                  : c.title,
              preview: text,
              updatedAt: "Just now",
              messages: [...c.messages, userMsg],
            }
          : c,
      );
    });

    if (!activeId && convoId) {
      setActiveId(convoId);
    }

    setInput("");
    setIsThinking(true);

    window.setTimeout(() => {
      const replyId = makeId();
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convoId
            ? {
                ...c,
                preview: text,
                updatedAt: "Just now",
                messages: [
                  ...c.messages,
                  {
                    id: replyId,
                    role: "assistant",
                    body: assistantReplyFor(text),
                  },
                ],
              }
            : c,
        ),
      );
      setIsThinking(false);
    }, 700);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-white dark:bg-zinc-900"
    >
      {/* Spacer — reserves the rail's collapsed width in the flex layout */}
      <div className="hidden w-14 shrink-0 md:block" aria-hidden />

      {/* Conversations sidebar — absolute overlay so expanding doesn't resize chat */}
      <aside className="group/rail absolute left-0 top-0 z-20 hidden h-full w-14 flex-col overflow-hidden border-r border-zinc-100 bg-zinc-50/95 backdrop-blur-sm transition-[width,box-shadow] duration-200 ease-out hover:w-72 hover:shadow-xl hover:shadow-zinc-900/10 md:flex dark:border-zinc-800 dark:bg-zinc-950/90 dark:hover:shadow-black/40">
        <div className="space-y-3 px-2 pb-2 pt-3 group-hover/rail:px-3">
          <button
            type="button"
            onClick={startNewChat}
            title="New chat"
            className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-2 text-[12.5px] font-medium text-white shadow-sm shadow-primary/30 transition-all hover:shadow-md hover:shadow-primary/40"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden whitespace-nowrap group-hover/rail:inline">
              New chat
            </span>
          </button>

          <div className="relative hidden group-hover/rail:block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats"
              className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2.5 text-[12.5px] text-zinc-800 placeholder-zinc-400 outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1.5 pb-3 group-hover/rail:px-2">
          {filtered.length === 0 ? (
            <div className="mx-2 mt-4 hidden rounded-lg border border-dashed border-zinc-200 px-3 py-6 text-center text-[12px] text-zinc-500 group-hover/rail:block dark:border-zinc-800 dark:text-zinc-400">
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
                      onClick={() => setActiveId(convo.id)}
                      title={convo.title}
                      className={cn(
                        "group/item relative flex w-full items-center justify-center gap-2 rounded-lg px-1.5 py-2 text-left transition-colors group-hover/rail:items-start group-hover/rail:justify-start group-hover/rail:px-2.5",
                        isActive
                          ? "bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
                          : "hover:bg-white/70 dark:hover:bg-zinc-900/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-6 w-6 shrink-0 place-items-center rounded-md group-hover/rail:mt-0.5",
                          isActive
                            ? "bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30"
                            : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                        )}
                      >
                        <FileText className="h-3 w-3" />
                      </span>
                      <span className="hidden min-w-0 flex-1 group-hover/rail:block">
                        <span className="block truncate text-[12.5px] font-medium text-zinc-800 dark:text-zinc-100">
                          {convo.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                          {convo.preview}
                        </span>
                      </span>
                      <span className="ml-auto hidden shrink-0 flex-col items-end gap-1 group-hover/rail:flex">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                          {convo.updatedAt}
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`Delete ${convo.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteConversation(convo.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteConversation(convo.id);
                            }
                          }}
                          className="grid h-5 w-5 cursor-pointer place-items-center rounded text-zinc-400 opacity-0 transition-opacity hover:bg-zinc-100 hover:text-rose-500 group-hover/item:opacity-100 dark:hover:bg-zinc-800"
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

        <div className="hidden border-t border-zinc-100 px-3 py-2.5 text-[10.5px] text-zinc-400 group-hover/rail:block dark:border-zinc-800 dark:text-zinc-500">
          UI preview · no answers persisted
        </div>
      </aside>

      {/* Main chat */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                {active?.title ?? "Start a new conversation"}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                Drafting assistant for {workspaceName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startNewChat}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white md:hidden"
            >
              <MessageSquarePlus className="h-3.5 w-3.5" />
              New
            </button>
            <button
              type="button"
              onClick={() => setIsPdfOpen(true)}
              aria-label="Show PDF panel"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-[12px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 lg:hidden dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
            >
              <PanelRightOpen className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6">
          {!active || active.messages.length === 0 ? (
            <EmptyState
              onSuggestion={(s) => {
                setInput(s);
                textareaRef.current?.focus();
              }}
              workspaceName={workspaceName}
            />
          ) : (
            <ul className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {active.messages.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  userInitial={userInitial}
                  userImage={userImage}
                />
              ))}
              {isThinking ? <ThinkingRow /> : null}
              <div ref={messagesEndRef} />
            </ul>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-zinc-100 px-3 pb-3 pt-3 dark:border-zinc-800 sm:px-6"
        >
          <div className="mx-auto w-full max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 dark:border-zinc-800 dark:bg-zinc-950/40">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the proposal you want to draft…"
                className="max-h-[180px] min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[13.5px] leading-relaxed text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!input.trim() || isThinking}
                aria-label="Send"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/30 transition-all enabled:hover:shadow-md enabled:hover:shadow-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 px-1 text-[10.5px] text-zinc-400 dark:text-zinc-500">
              Press Enter to send · Shift + Enter for newline
            </p>
          </div>
        </form>
      </section>

      {/* Mobile/tablet drawer backdrop */}
      {isPdfOpen ? (
        <div
          onClick={() => setIsPdfOpen(false)}
          aria-hidden
          className="absolute inset-0 z-30 bg-zinc-900/40 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      {/* PDF preview panel — inline on lg+, slide-in drawer below lg */}
      <aside
        style={{ ["--pdf-w" as string]: `${pdfWidth}%` }}
        className={cn(
          "shrink-0 flex-col border-l border-zinc-100 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/95",
          // Below lg: drawer-style overlay
          "absolute inset-y-0 right-0 z-40 w-full max-w-md shadow-2xl shadow-black/30",
          isPdfOpen ? "flex" : "hidden",
          // lg+: inline column, resizable width (percentage of chat container)
          "lg:relative lg:flex lg:max-w-none lg:shadow-none lg:w-[var(--pdf-w)]",
        )}
      >
        {/* Drag handle — only meaningful in inline mode */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize PDF panel"
          onMouseDown={startPdfResize}
          onDoubleClick={() => setPdfWidth(40)}
          className="group/resize absolute -left-1 top-0 z-10 hidden h-full w-2 cursor-col-resize lg:block"
        >
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 transition-colors",
              "bg-transparent group-hover/resize:bg-primary/50",
            )}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
              <FileText className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                Proposal PDF
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Preview & export
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsPdfOpen(false)}
            aria-label="Close PDF panel"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="flex w-full max-w-xs flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <FileUp className="h-5 w-5" />
            </span>
            <p className="mt-3 text-[12.5px] font-medium text-zinc-700 dark:text-zinc-200">
              No PDF loaded yet
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Generated proposal PDFs will appear here for preview and
              download.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MessageRow({
  message,
  userInitial,
  userImage,
}: {
  message: ChatMessage;
  userInitial: string;
  userImage: string | null;
}) {
  const isUser = message.role === "user";
  return (
    <li
      className={cn(
        "flex items-start gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {isUser ? (
        userImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userImage}
            alt=""
            referrerPolicy="no-referrer"
            className="h-7 w-7 shrink-0 rounded-lg ring-1 ring-zinc-200 dark:ring-zinc-700"
          />
        ) : (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            {userInitial}
          </span>
        )
      ) : (
        <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/20">
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
          />
          <Sparkles className="relative h-3.5 w-3.5" />
        </span>
      )}

      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/25"
            : "rounded-tl-sm border border-zinc-100 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-100",
        )}
      >
        {message.body}
      </div>
    </li>
  );
}

function ThinkingRow() {
  return (
    <li className="flex items-start gap-2.5">
      <span className="relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm shadow-primary/20">
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
        />
        <Sparkles className="relative h-3.5 w-3.5" />
      </span>
      <div className="rounded-2xl rounded-tl-sm border border-zinc-100 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-950/60">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:-0.3s] dark:bg-zinc-500" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 [animation-delay:-0.15s] dark:bg-zinc-500" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-400 dark:bg-zinc-500" />
        </span>
      </div>
    </li>
  );
}

function EmptyState({
  onSuggestion,
  workspaceName,
}: {
  onSuggestion: (text: string) => void;
  workspaceName: string;
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-2 py-6 text-center">
      <span className="relative grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-md shadow-primary/30">
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent"
        />
        <Sparkles className="relative h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[18px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        Draft a proposal for {workspaceName}
      </h2>
      <p className="mt-1.5 max-w-md text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
        Describe the client, scope, and budget. The assistant will outline an
        executive summary, deliverables, timeline, and pricing you can iterate
        on.
      </p>

      <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestionPrompts.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSuggestion(s)}
            className="group rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-[12.5px] text-zinc-700 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700"
          >
            <span className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{s}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
