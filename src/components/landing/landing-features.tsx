const features = [
  {
    id: "01",
    title: "Typed notes, not loose text",
    body: "Every note passes Effect schemas before it lands in the vault — empty titles and runaway bodies never sneak in.",
  },
  {
    id: "02",
    title: "Session-aware from the server",
    body: "Appwrite cookies hydrate in server components. Your account state is real on first paint, not a client-side guess.",
  },
  {
    id: "03",
    title: "Quiet by design",
    body: "A workspace that stays out of the way: search later, sync later — first it protects what you wrote.",
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-6 md:px-10 md:pb-28"
    >
      <header className="max-w-xl">
        <p className="font-mono text-xs tracking-[0.18em] text-muted-foreground uppercase">
          Features
        </p>
        <h2
          id="features-heading"
          className="mt-3 font-display text-3xl font-semibold tracking-tight text-balance text-foreground sm:text-4xl md:text-5xl"
        >
          Built like a vault, not a notepad.
        </h2>
      </header>

      <ol className="mt-12 space-y-0 border-t border-border">
        {features.map((feature, index) => (
          <li
            key={feature.id}
            className={`grid gap-4 border-b border-border py-8 md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1.05fr)] md:gap-10 md:py-10 ${
              index % 2 === 1 ? "md:pl-10" : ""
            }`}
          >
            <span className="font-mono text-sm text-muted-foreground">
              {feature.id}
            </span>
            <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {feature.title}
            </h3>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground md:justify-self-end">
              {feature.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
