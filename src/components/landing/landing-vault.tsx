import Link from "next/link";

const steps = [
  {
    title: "Write",
    detail: "Capture a thought with a title that means something later.",
  },
  {
    title: "Guard",
    detail: "Effect validates shape and length before anything is stored.",
  },
  {
    title: "Keep",
    detail: "Appwrite holds the session — your vault stays yours across devices.",
  },
];

export function LandingVault() {
  return (
    <section
      id="vault"
      aria-labelledby="vault-heading"
      className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 md:px-10 md:pb-28"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[oklch(0.82_0.03_45)] bg-[oklch(0.22_0.02_40)] px-6 py-12 text-[oklch(0.96_0.01_85)] shadow-[0_28px_60px_-28px_rgba(20,12,8,0.45)] sm:px-10 sm:py-14 md:rounded-[2.5rem]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-[oklch(0.72_0.09_65_/_0.35)] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-28 -left-10 size-80 rounded-full bg-[oklch(0.55_0.05_230_/_0.25)] blur-3xl"
        />

        <div className="relative grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="font-mono text-xs tracking-[0.18em] text-[oklch(0.78_0.08_65)] uppercase">
              The vault
            </p>
            <h2
              id="vault-heading"
              className="mt-3 max-w-md font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl"
            >
              Three moves. Nothing clever in the way.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-[oklch(0.78_0.02_80)]">
              NoteValut is a short ritual: write, guard, keep. Open the vault when
              you are ready to practice it.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-11 items-center rounded-full bg-[oklch(0.78_0.09_65)] px-6 text-sm font-medium text-[oklch(0.18_0.02_40)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              Open the vault
            </Link>
          </div>

          <ol className="relative space-y-6" aria-label="Vault ritual">
            {steps.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/20 font-mono text-xs text-[oklch(0.78_0.08_65)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-[oklch(0.75_0.02_80)]">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
