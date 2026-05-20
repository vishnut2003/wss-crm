import "server-only";

import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_MAX_TOKENS = 4096;

let clientSingleton: Anthropic | null = null;

function getClient(): Anthropic {
  if (clientSingleton) return clientSingleton;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env file before calling the Claude API.",
    );
  }
  clientSingleton = new Anthropic({ apiKey });
  return clientSingleton;
}

export type ClaudeRole = "user" | "assistant";

export type ClaudeMessage = {
  role: ClaudeRole;
  content: string;
};

export type ClaudeUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
};

export type ClaudeTool = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type ClaudeToolCall = {
  id: string;
  name: string;
  input: Record<string, unknown>;
};

export type ClaudeRequestOptions = {
  /** Optional system prompt. Cached by default for cheaper repeated calls. */
  system?: string;
  /** Conversation messages, oldest first. Must alternate user/assistant. */
  messages: ClaudeMessage[];
  /** Model id. Defaults to claude-sonnet-4-6. */
  model?: string;
  /** Max output tokens. Defaults to 4096. */
  maxTokens?: number;
  /** Sampling temperature (0–1). Omit to use Anthropic's default. */
  temperature?: number;
  /** Apply ephemeral prompt caching to the system prompt. Defaults to true. */
  cacheSystem?: boolean;
  /** Tools Claude may call. */
  tools?: ClaudeTool[];
  /** AbortSignal for cancelling the request. */
  signal?: AbortSignal;
};

export type ClaudeResponse = {
  text: string;
  toolCalls: ClaudeToolCall[];
  stopReason: string | null;
  usage: ClaudeUsage;
  raw: Anthropic.Messages.Message;
};

function buildSystemParam(
  system: string | undefined,
  cacheSystem: boolean,
): Anthropic.Messages.MessageCreateParams["system"] {
  if (!system) return undefined;
  if (!cacheSystem) return system;
  return [
    {
      type: "text",
      text: system,
      cache_control: { type: "ephemeral" },
    },
  ];
}

function extractText(message: Anthropic.Messages.Message): string {
  return message.content
    .filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("");
}

function extractToolCalls(message: Anthropic.Messages.Message): ClaudeToolCall[] {
  return message.content
    .filter(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use",
    )
    .map((block) => ({
      id: block.id,
      name: block.name,
      input: (block.input ?? {}) as Record<string, unknown>,
    }));
}

function normaliseUsage(usage: Anthropic.Messages.Usage): ClaudeUsage {
  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    cacheCreationInputTokens: usage.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: usage.cache_read_input_tokens ?? 0,
  };
}

/**
 * Send a non-streaming chat completion to Claude and return the assistant's
 * text reply along with usage metrics.
 */
export async function generateClaudeResponse({
  system,
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature,
  cacheSystem = true,
  tools,
  signal,
}: ClaudeRequestOptions): Promise<ClaudeResponse> {
  const client = getClient();

  const response = await client.messages.create(
    {
      model,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(buildSystemParam(system, cacheSystem)
        ? { system: buildSystemParam(system, cacheSystem) }
        : {}),
      ...(tools && tools.length ? { tools } : {}),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    },
    signal ? { signal } : undefined,
  );

  return {
    text: extractText(response),
    toolCalls: extractToolCalls(response),
    stopReason: response.stop_reason ?? null,
    usage: normaliseUsage(response.usage),
    raw: response,
  };
}

export type ClaudeStreamChunk =
  | { type: "text"; delta: string }
  | { type: "done"; stopReason: string | null; usage: ClaudeUsage };

/**
 * Stream a chat completion from Claude. Yields incremental text deltas, then a
 * final `done` chunk with stop reason and usage totals.
 */
export async function* streamClaudeResponse({
  system,
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature,
  cacheSystem = true,
  signal,
}: ClaudeRequestOptions): AsyncGenerator<ClaudeStreamChunk, void, void> {
  const client = getClient();

  const stream = client.messages.stream(
    {
      model,
      max_tokens: maxTokens,
      ...(temperature !== undefined ? { temperature } : {}),
      ...(buildSystemParam(system, cacheSystem)
        ? { system: buildSystemParam(system, cacheSystem) }
        : {}),
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    },
    signal ? { signal } : undefined,
  );

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield { type: "text", delta: event.delta.text };
    }
  }

  const final = await stream.finalMessage();
  yield {
    type: "done",
    stopReason: final.stop_reason ?? null,
    usage: normaliseUsage(final.usage),
  };
}
