import Link from "next/link";

const footerLinks = [
  { href: "#product", label: "Product" },
  { href: "#features", label: "Features" },
  { href: "/demo", label: "Demo" },
  { href: "/signup", label: "Create account" },
  { href: "/login", label: "Sign in" },
] as const;

export function LandingFooter() {
  return (
    <footer className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 md:px-10">
      <div className="flex flex-col gap-6 border-t border-[oklch(0.82_0.02_50)] pt-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight text-[oklch(0.18_0.02_40)]">
            NoteValut
          </p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-[oklch(0.45_0.02_50)]">
            The quiet workspace where better notes stay found.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[oklch(0.45_0.02_50)] underline-offset-2 transition-colors hover:text-[oklch(0.25_0.02_40)] hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <p className="mt-6 font-mono text-xs text-[oklch(0.55_0.02_50)]">
        Next.js · Effect · Appwrite
      </p>
    </footer>
  );
}
