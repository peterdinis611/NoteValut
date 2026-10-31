import { LandingCta } from "./landing-cta";
import { LandingFeatures } from "./landing-features";
import { LandingFooter } from "./landing-footer";
import { LandingHero } from "./landing-hero";
import { LandingNav } from "./landing-nav";
import { LandingOnboarding } from "./landing-onboarding";
import { LandingVault } from "./landing-vault";

export function LandingPage() {
  return (
    <div className="landing-shell relative flex min-h-full flex-1 flex-col bg-[oklch(0.94_0.02_65)] text-foreground dark:bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,oklch(0.9_0.04_55/_0.7),transparent_55%)] dark:bg-[radial-gradient(ellipse_60%_42%_at_50%_-10%,oklch(0.35_0.05_55/_0.22),transparent_62%)]"
      />

      <div className="relative z-10 mx-3 my-3 flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_80px_-40px_rgba(60,30,10,0.35)] md:mx-5 md:my-4 md:rounded-[2rem] dark:shadow-[0_24px_80px_-40px_rgba(0,0,0,0.65)]">
        <div
          aria-hidden
          className="landing-paper pointer-events-none absolute inset-0 rounded-[inherit]"
        />
        <LandingNav />
        <main id="main-content">
          <LandingHero />
          <LandingOnboarding />
          <LandingFeatures />
          <LandingVault />
          <LandingCta />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
