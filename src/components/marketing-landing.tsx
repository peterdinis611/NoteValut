"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { playLandingMotion } from "@/lib/landing-motion";
import { NotesHeroArt, NotesSack, FeatureDoodle } from "./marketing-hero-art";
import { LandingScrollTop } from "./landing-scroll-top";
import "./marketing-landing.css";

function SplitLine({
  as: Tag,
  text,
}: {
  as: "span" | "em";
  text: string;
}) {
  const words = text.split(" ");
  return (
    <Tag className="nv-land-line">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="nv-land-word">
          {word}
          {i < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </Tag>
  );
}

const FEATURES = [
  {
    k: "01",
    kind: "nest" as const,
    title: "Pages that nest",
    body: "Collections, entries, and subpages — the same tree you already think in.",
  },
  {
    k: "02",
    kind: "graph" as const,
    title: "A living graph",
    body: "Backlinks draw themselves. See how ideas lean on each other.",
  },
  {
    k: "03",
    kind: "daily" as const,
    title: "Daily folio",
    body: "One page for today. Capture, tick, and close the loop before midnight.",
  },
  {
    k: "04",
    kind: "offline" as const,
    title: "Writes offline",
    body: "The queue keeps your edits. When the line returns, the vault catches up.",
  },
];

export function MarketingLanding() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return playLandingMotion(root);
  }, []);

  return (
    <div className="nv-land-root" data-testid="marketing-landing" ref={rootRef}>
      <div className="nv-land">
        <header className="nv-land-nav nv-land-await">
          <Link href="/" className="nv-land-logo">
            <span className="nv-land-mark" aria-hidden />
            NoteVault
          </Link>
          <nav className="nv-land-pill" aria-label="Primary">
            <Link href="/" className="is-active">
              Home
            </Link>
            <a href="#features">All notes</a>
            <a href="#how">How it works</a>
            <Link href="/sign-in">Sign in</Link>
          </nav>
          <div className="nv-land-tools">
            <Link href="/sign-in" className="nv-land-tool">
              Log in
            </Link>
            <Link href="/sign-up" className="nv-land-avatar" aria-label="Create account">
              N
            </Link>
          </div>
        </header>

        <section className="nv-land-hero">
          <h1>
            <SplitLine as="span" text="Your Daily Pages" />
            <SplitLine as="em" text="Perfectly Linked" />
          </h1>

          <div className="nv-land-board">
            <div className="nv-land-col nv-land-col-left nv-land-await">
              <NotesSack />
              <p className="nv-land-stat">
                <strong>
                  <span className="nv-land-count">100</span>%
                </strong>
                Private pages
              </p>
              <p className="nv-land-stat">
                <strong>Offline</strong>
                First, then synced
              </p>
            </div>

            <div className="nv-land-art-wrap nv-land-await">
              <NotesHeroArt />
            </div>

            <div className="nv-land-col nv-land-col-right nv-land-await">
              <p className="nv-land-blurb">
                Handwritten thinking, made from pages you actually keep — not another dump of tabs.
              </p>
              <Link href="/sign-up" className="nv-land-order nv-land-await">
                Open your vault
                <ArrowUpRight className="size-4" />
              </Link>
              <div className="nv-land-proof">
                <div className="nv-land-faces" aria-hidden>
                  <span>⌘K</span>
                  <span>∞</span>
                  <span>▣</span>
                </div>
                <p>
                  <strong>Local-first</strong>
                  Graph, dailies, slash
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="nv-land-section" id="features">
          <h2 className="nv-land-await">What’s in the bag</h2>
          <div className="nv-land-bento">
            {FEATURES.map((f) => (
              <article key={f.k} className="nv-land-await">
                <FeatureDoodle kind={f.kind} />
                <span>{f.k}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nv-land-section" id="how">
          <h2 className="nv-land-await">How it becomes a vault</h2>
          <ol>
            <li className="nv-land-await">
              <strong>Open a desk.</strong> One account. Pages stay private until you share.
            </li>
            <li className="nv-land-await">
              <strong>Write in blocks.</strong> Headings, todos, callouts — drop in and move on.
            </li>
            <li className="nv-land-await">
              <strong>Let it link.</strong> The graph shows up on its own.
            </li>
          </ol>
        </section>

        <section className="nv-land-cta nv-land-await" data-testid="landing-cta">
          <h2>
            Start a vault
            <em> tonight.</em>
          </h2>
          <p>Free to open. Private by default. Your first page is a blank folio — or a template.</p>
          <div className="nv-land-cta-row">
            <Link href="/sign-up" className="nv-land-order">
              Create a free vault
              <ArrowUpRight className="size-4" />
            </Link>
            <Link href="/sign-in" className="nv-land-ghost">
              I already have one
            </Link>
          </div>
        </section>

        <footer className="nv-land-foot nv-land-await">
          <span>NoteVault</span>
          <span>Notes, not coffee — still a daily ritual.</span>
        </footer>
      </div>
      <LandingScrollTop />
    </div>
  );
}
