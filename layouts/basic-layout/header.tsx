import Link from "next/link";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/60 bg-white/70 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group relative flex items-center gap-2.5">
          <span
            aria-hidden
            className="pointer-events-none absolute -left-3 -top-2 -z-10 h-10 w-20 rounded-full bg-gradient-to-r from-primary/30 to-secondary/30 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
          />
          <span className="flex items-baseline text-xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              WSS
            </span>
            <span className="ml-1.5 text-zinc-900 dark:text-white">CRM</span>
            <span
              aria-hidden
              className="ml-0.5 h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-gradient-to-br from-primary to-secondary"
            />
          </span>
          <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:inline-block">
            Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
            >
              {link.label}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-3 -bottom-0.5 h-0.5 origin-center scale-x-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-0 transition-all duration-300 group-hover:scale-x-100 group-hover:opacity-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 sm:inline-flex dark:text-zinc-300 dark:hover:bg-zinc-800/70"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-md bg-gradient-to-r from-primary to-secondary px-4 text-sm font-medium text-white shadow-sm shadow-primary/25 transition-all duration-200 hover:shadow-md hover:shadow-primary/35"
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full"
            />
            <span className="relative flex items-center gap-1.5">
              Get started
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </span>
          </Link>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />
    </header>
  );
}
