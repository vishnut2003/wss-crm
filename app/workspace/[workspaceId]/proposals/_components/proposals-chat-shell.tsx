"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { SerializedProposalChat } from "../_lib/serialize";
import ConversationsRail from "./conversations-rail";

type RailContextValue = {
  isRailOpen: boolean;
  setIsRailOpen: (open: boolean) => void;
};

const RailContext = createContext<RailContextValue | null>(null);

export function useRail(): RailContextValue {
  const ctx = useContext(RailContext);
  if (!ctx) {
    throw new Error("useRail must be used inside <ProposalsChatShell>");
  }
  return ctx;
}

type Props = {
  workspaceId: string;
  conversations: SerializedProposalChat[];
  children: ReactNode;
};

export default function ProposalsChatShell({
  workspaceId,
  conversations,
  children,
}: Props) {
  const [isRailOpen, setIsRailOpen] = useState(false);

  return (
    <RailContext.Provider value={{ isRailOpen, setIsRailOpen }}>
      <div className="relative flex h-full min-h-0 w-full flex-1 overflow-hidden bg-white dark:bg-zinc-900">
        {/* Reserves the rail's collapsed width in the flex layout on md+ */}
        <div className="hidden w-14 shrink-0 md:block" aria-hidden />

        {/* Mobile backdrop when the rail is opened via the header toggle */}
        {isRailOpen ? (
          <div
            onClick={() => setIsRailOpen(false)}
            aria-hidden
            className="absolute inset-0 z-10 bg-zinc-900/40 backdrop-blur-[1px] md:hidden"
          />
        ) : null}

        <ConversationsRail
          workspaceId={workspaceId}
          conversations={conversations}
        />

        {children}
      </div>
    </RailContext.Provider>
  );
}
