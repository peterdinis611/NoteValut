import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Create your account",
    body: "Sign up with email. Appwrite holds the session cookie for SSR.",
  },
  {
    n: "02",
    title: "Confirm the inbox",
    body: "Open the verification link — then your vault knows it’s really you.",
  },
  {
    n: "03",
    title: "Write the first note",
    body: "Titles, tags, and checklists — Effect validates before anything lands.",
  },
];

export function LandingOnboarding() {
  return (
    <section
      id="onboarding"
      aria-labelledby="onboarding-heading"
      className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16 pt-4 md:px-10 md:pb-20"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <header className="max-w-xl">
          <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
            Onboarding
          </p>
          <h2
            id="onboarding-heading"
            className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            Three quiet steps into the vault.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-muted-foreground">
            No tour balloons. Just the path from signup to a note that stays
            found.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85"
          >
            Start onboarding
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center rounded-full border border-border bg-card/80 px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Try the demo
          </Link>
        </div>
      </div>

      <ol className="mt-10 grid gap-4 md:grid-cols-3" aria-label="Onboarding steps">
        {steps.map((step) => (
          <li
            key={step.n}
            className="rounded-[1.5rem] border border-border bg-card/80 px-5 py-6 shadow-[0_12px_32px_-24px_rgba(40,24,12,0.35)] dark:shadow-[0_12px_32px_-24px_rgba(0,0,0,0.5)]"
          >
            <span className="font-mono text-xs text-muted-foreground">
              {step.n}
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
