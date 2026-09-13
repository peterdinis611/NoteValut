"use client";

import { useEffect, useId, useState } from "react";

type Props = {
  source: string;
  className?: string;
};

type RenderState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; svg: string }
  | { status: "error"; message: string };

let mermaidReady: Promise<typeof import("mermaid")> | null = null;

async function getMermaid() {
  if (!mermaidReady) {
    mermaidReady = import("mermaid").then(async (mod) => {
      mod.default.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "base",
        fontFamily: "var(--font-body), Sora, ui-sans-serif, system-ui, sans-serif",
        themeVariables: {
          primaryColor: "#efe4d0",
          primaryTextColor: "#171412",
          primaryBorderColor: "#171412",
          lineColor: "#5a5248",
          secondaryColor: "#fffdf8",
          tertiaryColor: "#b9a3e6",
          background: "#fffdf8",
          mainBkg: "#fffdf8",
          nodeBorder: "#171412",
          clusterBkg: "#fbf8f2",
          titleColor: "#171412",
          edgeLabelBackground: "#fffdf8",
        },
      });
      return mod;
    });
  }
  return mermaidReady;
}

export function MermaidPreview({ source, className }: Props) {
  const reactId = useId().replace(/:/g, "");
  const [state, setState] = useState<RenderState>({ status: "idle" });

  useEffect(() => {
    const code = source.trim();
    if (!code) {
      setState({ status: "idle" });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const mermaid = await getMermaid();
          const id = `nv-mermaid-${reactId}-${Date.now()}`;
          const { svg } = await mermaid.default.render(id, code);
          if (!cancelled) setState({ status: "ready", svg });
        } catch (err) {
          if (cancelled) return;
          const message =
            err instanceof Error ? err.message.replace(/^Error:\s*/i, "") : "Invalid Mermaid diagram";
          setState({ status: "error", message });
        }
      })();
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, reactId]);

  if (state.status === "idle") {
    return (
      <div className={`nv-mermaid nv-mermaid-empty ${className ?? ""}`}>
        Write a Mermaid diagram — flowchart, sequence, class, …
      </div>
    );
  }

  if (state.status === "loading") {
    return <div className={`nv-mermaid nv-mermaid-loading ${className ?? ""}`}>Rendering diagram…</div>;
  }

  if (state.status === "error") {
    return (
      <div className={`nv-mermaid nv-mermaid-error ${className ?? ""}`}>
        <p className="nv-mermaid-error-title">Couldn’t render diagram</p>
        <pre className="nv-mermaid-error-msg">{state.message}</pre>
      </div>
    );
  }

  return (
    <div
      className={`nv-mermaid nv-mermaid-ready ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: state.svg }}
    />
  );
}

export const MERMAID_STARTER = `flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Do the thing]
  B -->|No| D[Keep writing]
  C --> E[Done]
  D --> E`;
