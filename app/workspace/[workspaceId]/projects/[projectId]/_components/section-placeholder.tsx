import type { ComponentType, SVGProps } from "react";

// Lightweight empty state for project sub-pages that aren't built yet.
export default function SectionPlaceholder({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-white to-violet-500/[0.04] dark:from-indigo-500/[0.12] dark:via-zinc-900 dark:to-violet-500/[0.10]"
      />
      <div className="relative flex flex-col items-center justify-center">
        <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/30">
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent"
          />
          <Icon className="relative h-5 w-5" />
        </span>
        <h2 className="mt-4 text-[16px] font-medium text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>
    </div>
  );
}
