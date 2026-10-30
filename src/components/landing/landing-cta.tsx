import Link from "next/link";

export function LandingCta() {
  return (
    <section
      id="resources"
      aria-labelledby="cta-heading"
      className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 md:px-10 md:pb-12"
    >
      <div className="flex flex-col items-start gap-6 border-t border-[oklch(0.82_0.02_50)] pt-14 md:flex-row md:items-end md:justify-between md:pt-16">
        <div className="max-w-lg">
          <h2
            id="cta-heading"
            className="font-display text-3xl font-semibold tracking-tight text-[oklch(0.18_0.02_40)] text-balance sm:text-4xl"
          >
            Ready when the next note is.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[oklch(0.45_0.02_50)]">
            Free to start. Effect on the domain. Appwrite on the session. Your
            words stay in the vault.
          </p>
        </div>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Get started">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full bg-[oklch(0.18_0.02_40)] px-6 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.28_0.02_40)]"
          >
            Get NoteValut Free
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full border border-[oklch(0.75_0.02_50)] bg-white/70 px-6 text-sm font-medium text-[oklch(0.25_0.02_40)] transition-colors hover:bg-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
