"use client";

import Lottie from "lottie-react";
import Link from "next/link";
import type { ReactNode } from "react";
import errorAnimation from "@/assets/lottie/error.json";
import loadingAnimation from "@/assets/lottie/loading.json";
import notAuthorizedAnimation from "@/assets/lottie/not-authorized.json";
import notFoundAnimation from "@/assets/lottie/not-found.json";

export type StatusVariant = "loading" | "error" | "not-found" | "not-authorized";

const ANIMATIONS: Record<StatusVariant, object> = {
  loading: loadingAnimation,
  error: errorAnimation,
  "not-found": notFoundAnimation,
  "not-authorized": notAuthorizedAnimation,
};

export type StatusAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
};

type Props = {
  variant: StatusVariant;
  title: string;
  description: string;
  /** Optional technical detail (stack message, digest) — kept visually quiet. */
  detail?: string;
  actions?: StatusAction[];
  children?: ReactNode;
  compact?: boolean;
};

export function LottieStatus({
  variant,
  title,
  description,
  detail,
  actions,
  children,
  compact = false,
}: Props) {
  const loop = variant === "loading";

  return (
    <div className={`status-page ${compact ? "status-page-compact" : ""}`}>
      <div className="status-glow" aria-hidden />
      <div className={`status-lottie status-lottie-${variant}`}>
        <Lottie
          animationData={ANIMATIONS[variant]}
          loop={loop}
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <p className="status-kicker">NoteVault</p>
      <h1 className="status-title">{title}</h1>
      <p className="status-description">{description}</p>
      {detail ? (
        <details className="status-detail">
          <summary>Technical details</summary>
          <p className="status-meta">{detail}</p>
        </details>
      ) : null}
      {children}
      {actions && actions.length > 0 && (
        <div className="status-actions">
          {actions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                className={`status-btn ${action.primary ? "status-btn-primary" : ""}`}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                className={`status-btn ${action.primary ? "status-btn-primary" : ""}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
