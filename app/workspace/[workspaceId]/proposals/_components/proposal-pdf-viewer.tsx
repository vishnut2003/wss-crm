"use client";

import { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText, FileUp, Loader2 } from "lucide-react";
import type { ProposalDocument } from "@/lib/proposal-ai";
import { ProposalPdfDocument } from "./proposal-pdf-document";

type Props = {
  proposal: ProposalDocument | null;
  showCloseButton?: boolean;
  onClose?: () => void;
};

type RenderResult = {
  forProposal: ProposalDocument;
  url: string | null;
  error: string | null;
};

export default function ProposalPdfViewer({ proposal }: Props) {
  const [result, setResult] = useState<RenderResult | null>(null);

  useEffect(() => {
    if (!proposal) return;
    let cancelled = false;
    let createdUrl: string | null = null;

    (async () => {
      try {
        const blob = await pdf(
          <ProposalPdfDocument data={proposal} />,
        ).toBlob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setResult({ forProposal: proposal, url: createdUrl, error: null });
      } catch (err) {
        console.error("[ProposalPdfViewer] render failed", err);
        if (cancelled) return;
        setResult({
          forProposal: proposal,
          url: null,
          error:
            err instanceof Error
              ? err.message
              : "Couldn't render the proposal PDF.",
        });
      }
    })();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [proposal]);

  const current = result && result.forProposal === proposal ? result : null;
  const blobUrl = current?.url ?? null;
  const error = current?.error ?? null;
  const isRendering = proposal !== null && current === null;

  if (!proposal) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex w-full max-w-xs flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <FileUp className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[12.5px] font-medium text-zinc-700 dark:text-zinc-200">
            No PDF loaded yet
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Ask the assistant to generate a proposal PDF — it will render here.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="w-full max-w-xs rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-center text-[12px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </div>
      </div>
    );
  }

  if (isRendering || !blobUrl) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-8">
        <div className="flex items-center gap-2 text-[12.5px] text-zinc-500 dark:text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Rendering proposal PDF…
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-100 bg-white/60 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="flex items-center gap-2 text-[11.5px] text-zinc-500 dark:text-zinc-400">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate">{proposal.title}</span>
        </div>
        <a
          href={blobUrl}
          download={`${proposal.title.replace(/[^\w-]+/g, "_")}.pdf`}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2 text-[11.5px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:text-white"
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </a>
      </div>
      <iframe
        title={`${proposal.title} preview`}
        src={blobUrl}
        className="h-full w-full flex-1 border-0 bg-zinc-100 dark:bg-zinc-950"
      />
    </div>
  );
}
