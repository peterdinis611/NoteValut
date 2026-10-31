import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-switch";

const links = [
  { href: "#product", label: "Product" },
  { href: "#onboarding", label: "Onboarding" },
  { href: "/demo", label: "Demo" },
  { href: "#features", label: "Features" },
] as const;

export function LandingNav() {
  return (
    <header className="landing-reveal relative z-20 mx-auto w-full max-w-5xl px-4 pt-5 md:px-6">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <nav
        aria-label="Primary"
        className="flex items-center gap-3 rounded-full border border-border/70 bg-card/90 px-3 py-2 shadow-[0_10px_40px_-18px_rgba(20,16,12,0.35)] backdrop-blur-md md:gap-4 md:px-4 dark:shadow-[0_10px_40px_-18px_rgba(0,0,0,0.55)]"
      >
        <Link
          href="/"
          className="shrink-0 px-2 font-display text-[1.35rem] font-semibold tracking-tight text-foreground md:text-xl"
          aria-label="NoteValut home"
        >
          NoteValut
        </Link>

        <ul className="mx-auto hidden items-center gap-0.5 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <Link
            href="/login"
            prefetch
            className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
          >
            Login
          </Link>
          <Link
            href="/signup"
            prefetch
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Create Account
          </Link>
        </div>
      </nav>
    </header>
  );
}
