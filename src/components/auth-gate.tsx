"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { playFolioPageMotion } from "@/lib/folio-page-motion";
import { NotesSack } from "./marketing-hero-art";
import "./marketing-landing.css";

type Props = {
  mode: "in" | "up";
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthGate({ mode, children, footer }: Props) {
  const isIn = mode === "in";
  const rootRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    return playFolioPageMotion(root);
  }, []);

  return (
    <main className="clerk-auth-page" ref={rootRef}>
      <div className="auth-gate">
        <aside className="auth-gate-specimen nv-folio-await">
          <Link href="/" className="auth-gate-logo">
            <span className="auth-gate-logo-mark" aria-hidden />
            NoteVault
          </Link>
          <p className="auth-gate-kicker">{isIn ? "Sign in" : "Create account"}</p>
          <h1 className="auth-gate-title">
            {isIn ? "Your Daily" : "Open a"}
            <em>{isIn ? "Pages" : "Vault"}</em>
          </h1>
          <p className="auth-gate-lede">
            {isIn
              ? "A private desk for notes, collections, and the links between them."
              : "Notes stay yours until you decide to share. First page is a blank folio."}
          </p>
          <NotesSack />
        </aside>

        <section className="auth-gate-desk nv-folio-await">
          <div className="auth-gate-plate">
            <header className="clerk-auth-brand">
              <p className="clerk-auth-product">NoteVault</p>
              <p className="clerk-auth-tagline">{isIn ? "Welcome back" : "New vault"}</p>
            </header>
            {children}
            {footer}
          </div>
        </section>
      </div>
    </main>
  );
}
