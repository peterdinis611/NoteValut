import Link from "next/link";

export function LandingCta() {
  return (
    <section
      id="resources"
      aria-labelledby="cta-heading"
      className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 md:px-10 md:pb-12"
    >
      <div className="flex flex-col items-start gap-6 border-t border-border pt-14 md:flex-row md:items-end md:justify-between md:pt-16">
        <div className="max-w-lg">
          <h2
            id="cta-heading"
            className="font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            Ready when the next note is.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Free to start. Effect on the domain. Appwrite on the session. Your
            words stay in the vault.
          </p>
        </div>
        <div className="flex flex-wrap gap-3" role="group" aria-label="Get started">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Get NoteValut Free
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-full border border-border bg-card/80 px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
