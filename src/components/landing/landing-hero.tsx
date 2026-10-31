import Link from "next/link";
import { Bookmark, Search, Tag, Wifi } from "lucide-react";
import { CurvedArrow, ReaderDoodle, VaultDoodle } from "./doodles";
import { FloatingChip } from "./floating-chip";

export function LandingHero() {
  return (
    <section
      id="product"
      aria-labelledby="hero-brand"
      className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center px-4 pb-16 pt-6 md:min-h-[calc(100svh-6rem)] md:px-8 md:pb-20 md:pt-8"
    >
      <div
        className="landing-reveal pointer-events-none absolute top-[8%] left-[-0.5%] w-[7.5rem] opacity-90 sm:w-[9rem] md:left-[1%] md:w-[10rem] lg:left-[3%] lg:w-[11.5rem]"
        style={{ animationDelay: "120ms" }}
      >
        <ReaderDoodle className="h-auto w-full" />
      </div>
      <div
        className="landing-reveal pointer-events-none absolute right-[-1%] bottom-[12%] w-[8rem] opacity-90 sm:w-[9.5rem] md:right-[1%] md:w-[11rem] lg:right-[2.5%] lg:w-[12.5rem]"
        style={{ animationDelay: "220ms" }}
      >
        <VaultDoodle className="h-auto w-full" />
      </div>

      <FloatingChip
        className="absolute top-[8%] left-[16%] hidden md:inline-flex"
        style={{ animationDelay: "280ms" }}
      >
        <Tag className="size-3.5 opacity-70" />
        Tags
      </FloatingChip>
      <CurvedArrow className="landing-reveal absolute top-[14%] left-[28%] hidden h-10 w-12 md:block" />

      <FloatingChip
        className="absolute top-[5%] right-[20%] hidden md:inline-flex"
        style={{ animationDelay: "340ms" }}
      >
        <Search className="size-3.5 opacity-70" />
        Find later
      </FloatingChip>

      <FloatingChip
        className="absolute top-[26%] right-[12%] hidden sm:inline-flex"
        style={{ animationDelay: "400ms" }}
      >
        <Wifi className="size-3.5 opacity-70" />
        Sync
      </FloatingChip>
      <CurvedArrow
        flip
        className="landing-reveal absolute top-[32%] right-[24%] hidden h-9 w-11 sm:block"
      />

      <FloatingChip
        className="absolute bottom-[20%] left-[11%] hidden md:inline-flex"
        style={{ animationDelay: "460ms" }}
      >
        <Bookmark className="size-3.5 opacity-70" />
        Keep
      </FloatingChip>

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <h1
          id="hero-brand"
          className="landing-reveal font-display text-5xl font-semibold tracking-tight text-[oklch(0.18_0.02_40)] sm:text-6xl md:text-7xl"
          style={{ animationDelay: "40ms" }}
        >
          NoteValut
        </h1>

        <div
          className="landing-reveal relative mt-7 w-full max-w-xl"
          style={{ animationDelay: "140ms" }}
        >
          <div className="relative isolate overflow-hidden rounded-[2rem] border border-black/8 bg-white/90 px-5 py-4 shadow-[0_18px_50px_-20px_rgba(20,16,12,0.28)] backdrop-blur-sm sm:rounded-[2.5rem] sm:px-8 sm:py-6">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-2/5 bg-[radial-gradient(120%_90%_at_0%_50%,oklch(0.9_0.06_55/_0.75),transparent_70%),radial-gradient(90%_80%_at_35%_80%,oklch(0.9_0.04_230/_0.4),transparent_65%)]"
            />
            <p className="relative font-display text-[1.65rem] font-semibold tracking-tight text-balance text-[oklch(0.18_0.02_40)] sm:text-3xl md:text-4xl">
              Your{" "}
              <span aria-hidden className="inline-block translate-y-0.5">
                📒
              </span>{" "}
              notes,{" "}
              <span aria-hidden className="inline-block translate-y-0.5">
                🏷
              </span>{" "}
              tags, &amp;
            </p>
          </div>

          <div className="relative -mt-2 ml-auto w-[92%] overflow-hidden rounded-[2rem] border border-black/8 bg-white/95 px-5 py-4 shadow-[0_18px_50px_-20px_rgba(20,16,12,0.28)] sm:rounded-[2.5rem] sm:px-8 sm:py-6">
            <p className="font-display text-[1.65rem] font-semibold tracking-tight text-balance text-[oklch(0.18_0.02_40)] sm:text-3xl md:text-4xl">
              <span aria-hidden className="inline-block translate-y-0.5">
                🔐
              </span>{" "}
              vault. Together.
            </p>
          </div>
        </div>

        <p
          className="landing-reveal mt-7 max-w-md text-base leading-relaxed text-[oklch(0.45_0.02_50)] sm:text-lg"
          style={{ animationDelay: "240ms" }}
        >
          NoteValut is the quiet workspace where better notes stay found. Backed
          by Appwrite.
        </p>

        <div
          className="landing-reveal mt-7 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: "320ms" }}
          role="group"
          aria-label="Primary actions"
        >
          <Link
            href="/signup"
            prefetch
            className="inline-flex h-12 items-center justify-center rounded-full bg-[oklch(0.18_0.02_40)] px-8 text-base font-medium text-white shadow-[0_12px_32px_-12px_rgba(20,16,12,0.45)] transition-[transform,background-color] hover:bg-[oklch(0.28_0.02_40)] hover:scale-[1.02] active:scale-[0.99]"
          >
            Get NoteValut Free
          </Link>
          <Link
            href="/demo"
            prefetch
            className="inline-flex h-12 items-center justify-center rounded-full border border-[oklch(0.75_0.02_50)] bg-white/60 px-6 text-base font-medium text-[oklch(0.28_0.02_40)] backdrop-blur-sm transition-colors hover:bg-white"
          >
            Try the demo
          </Link>
        </div>
      </div>
    </section>
  );
}
