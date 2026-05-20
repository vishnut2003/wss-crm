// Strip common Markdown syntax so the chat-card preview reads as plain prose.
// Intentionally lightweight — we only need to neutralise the formatting that
// the assistant tends to emit (bold/italic, headings, lists, code, links).
export function stripMarkdown(input: string): string {
  if (!input) return "";
  let out = input;

  // Fenced code blocks → keep inner text
  out = out.replace(/```[a-zA-Z0-9_-]*\n?([\s\S]*?)```/g, "$1");
  // Inline code
  out = out.replace(/`([^`]+)`/g, "$1");
  // Images ![alt](url) → alt
  out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Links [text](url) → text
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Headings (#, ##, ...)
  out = out.replace(/^#{1,6}\s+/gm, "");
  // Blockquotes
  out = out.replace(/^\s*>\s?/gm, "");
  // Unordered list markers
  out = out.replace(/^\s*[-*+]\s+/gm, "");
  // Ordered list markers
  out = out.replace(/^\s*\d+\.\s+/gm, "");
  // Bold/italic: ***x***, **x**, __x__, *x*, _x_
  out = out.replace(/(\*\*\*|___)(.+?)\1/g, "$2");
  out = out.replace(/(\*\*|__)(.+?)\1/g, "$2");
  out = out.replace(/(\*|_)(.+?)\1/g, "$2");
  // Strikethrough
  out = out.replace(/~~(.+?)~~/g, "$1");
  // Horizontal rules
  out = out.replace(/^\s*([-*_])\1{2,}\s*$/gm, "");
  // Collapse whitespace
  out = out.replace(/\s+/g, " ").trim();
  return out;
}
