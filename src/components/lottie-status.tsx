"use client";

import Lottie from "lottie-react";
import { ChevronDown, Copy, Check, Home, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import errorAnimation from "@/assets/lottie/error.json";
import loadingAnimation from "@/assets/lottie/loading.json";
import notAuthorizedAnimation from "@/assets/lottie/not-authorized.json";
import notFoundAnimation from "@/assets/lottie/not-found.json";
import { easeOutSoft } from "@/lib/motion";

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

export type StatusDetailRow = {
  label: string;
  value: string;
  mono?: boolean;
};

type Props = {
  variant: StatusVariant;
  title: string;
  description: string;
  /** Optional technical detail (stack message, digest) — kept visually quiet. */
  detail?: string;
  /** Structured rows shown under Technical details (preferred over `detail`). */
  detailRows?: StatusDetailRow[];
  /** Optional stack / long dump under the rows. */
  detailStack?: string;
  /** One-line preview shown above the details toggle (errors). */
  detailPreview?: string;
  actions?: StatusAction[];
  children?: ReactNode;
  compact?: boolean;
};

function actionIcon(label: string) {
  const key = label.toLowerCase();
  if (key.includes("try") || key.includes("reload") || key.includes("again")) {
    return RefreshCw;
  }
  if (key.includes("back") || key.includes("home") || key.includes("vault")) {
    return Home;
  }
  return null;
}

function CopyDetailsButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be denied */
    }
  }

  return (
    <button type="button" className="status-detail-copy" onClick={() => void copy()}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function LottieStatus({
  variant,
  title,
  description,
  detail,
  detailRows,
  detailStack,
  detailPreview,
  actions,
  children,
  compact = false,
}: Props) {
  const loop = variant === "loading" || variant === "not-found" || variant === "not-authorized";
  const hasDetail =
    Boolean(detail?.trim()) ||
    Boolean(detailRows?.length) ||
    Boolean(detailStack?.trim());

  const copyText = [
    detailPreview,
    ...(detailRows ?? []).map((r) => `${r.label}: ${r.value}`),
    detail?.trim(),
    detailStack?.trim(),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div
      className={`status-page status-page-${variant} ${compact ? "status-page-compact" : ""}`}
    >
      <div className="status-glow" aria-hidden />
      <motion.div
        className="status-shell"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={easeOutSoft}
      >
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

        {detailPreview ? (
          <p className="status-preview" title={detailPreview}>
            {detailPreview}
          </p>
        ) : null}

        {hasDetail ? (
          <details className="status-detail">
            <summary>
              <ChevronDown className="status-detail-chevron size-3.5" aria-hidden />
              Technical details
            </summary>
            <div className="status-detail-body">
              <div className="status-detail-toolbar">
                <span className="status-detail-toolbar-label">Diagnostics</span>
                {copyText ? <CopyDetailsButton text={copyText} /> : null}
              </div>
              {detailRows && detailRows.length > 0 ? (
                <dl className="status-detail-list">
                  {detailRows.map((row) => (
                    <div key={row.label} className="status-detail-row">
                      <dt>{row.label}</dt>
                      <dd
                        className={
                          row.mono !== false ? "status-detail-mono" : undefined
                        }
                      >
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
              {detail?.trim() ? <p className="status-meta">{detail}</p> : null}
              {detailStack?.trim() ? (
                <pre className="status-detail-stack">{detailStack.trim()}</pre>
              ) : null}
            </div>
          </details>
        ) : null}

        {children}

        {actions && actions.length > 0 && (
          <div className="status-actions">
            {actions.map((action) => {
              const Icon = actionIcon(action.label);
              const className = `status-btn ${action.primary ? "status-btn-primary" : ""}`;
              const content = (
                <>
                  {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                  {action.label}
                </>
              );
              return action.href ? (
                <Link key={action.label} href={action.href} className={className}>
                  {content}
                </Link>
              ) : (
                <button
                  key={action.label}
                  type="button"
                  className={className}
                  onClick={action.onClick}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function shortenConvexMessage(message: string): string {
  const server = message.match(/Server Error\s+(.+)$/i);
  if (server?.[1]) return server[1].trim();
  const fn = message.match(/Could not find public function for '([^']+)'/i);
  if (fn?.[1]) return `Missing Convex function: ${fn[1]}`;
  return message.length > 140 ? `${message.slice(0, 137)}…` : message;
}

/** Build structured technical detail props from a caught Error. */
export function errorStatusDetails(
  error: Error & { digest?: string },
  extras?: { path?: string; when?: string },
) {
  const rows: StatusDetailRow[] = [];
  const name = error.name?.trim() || "Error";
  const rawMessage = error.message?.trim() || "No message provided";
  const message = shortenConvexMessage(rawMessage);

  rows.push({ label: "Type", value: name });
  rows.push({ label: "Message", value: message });
  if (rawMessage !== message) {
    rows.push({ label: "Full", value: rawMessage });
  }
  if (error.digest) {
    rows.push({ label: "Digest", value: error.digest });
  }
  if (extras?.path) {
    rows.push({ label: "Path", value: extras.path });
  }
  if (extras?.when) {
    rows.push({ label: "When", value: extras.when });
  }

  const stack = error.stack
    ?.split("\n")
    .slice(0, 8)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  return {
    detailPreview: message,
    detailRows: rows,
    detailStack: stack,
  };
}
