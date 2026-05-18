export const WORKSPACE_COLORS = [
  "violet",
  "fuchsia",
  "blue",
  "emerald",
  "amber",
  "rose",
] as const;
export type WorkspaceColor = (typeof WORKSPACE_COLORS)[number];
