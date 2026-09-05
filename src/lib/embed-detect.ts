/** Detect known product URLs for richer embed cards. */

export type EmbedProvider = "github" | "notion" | "linear" | "figma" | "generic";

export type EmbedMeta = {
  provider: EmbedProvider;
  label: string;
  accent: string;
  title: string;
  subtitle: string;
};

export function detectEmbed(url: string): EmbedMeta {
  let host = "";
  let path = "";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname.replace(/\/$/, "");
  } catch {
    return {
      provider: "generic",
      label: "Link",
      accent: "var(--muted)",
      title: url || "Link",
      subtitle: "",
    };
  }

  if (host === "github.com" || host === "gist.github.com") {
    const parts = path.split("/").filter(Boolean);
    const title =
      parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] || "GitHub";
    const kind =
      parts[2] === "pull"
        ? `PR #${parts[3] ?? ""}`
        : parts[2] === "issues"
          ? `Issue #${parts[3] ?? ""}`
          : parts[2] === "blob" || parts[2] === "tree"
            ? parts.slice(2).join("/")
            : host;
    return {
      provider: "github",
      label: "GitHub",
      accent: "#8b949e",
      title,
      subtitle: kind,
    };
  }

  if (host.endsWith("notion.so") || host.endsWith("notion.site")) {
    const slug = decodeURIComponent(path.split("/").pop() || "Notion page");
    const title = slug.replace(/-[a-f0-9]{32}$/i, "").replace(/-/g, " ") || "Notion page";
    return {
      provider: "notion",
      label: "Notion",
      accent: "#ebebea",
      title,
      subtitle: host,
    };
  }

  if (host === "linear.app") {
    const parts = path.split("/").filter(Boolean);
    const issue = parts.find((p) => /^[A-Z]+-\d+$/i.test(p));
    return {
      provider: "linear",
      label: "Linear",
      accent: "#5e6ad2",
      title: issue ?? parts[parts.length - 1] ?? "Linear",
      subtitle: parts[0] ? `${parts[0]} workspace` : host,
    };
  }

  if (host === "figma.com") {
    return {
      provider: "figma",
      label: "Figma",
      accent: "#a259ff",
      title: decodeURIComponent(path.split("/").pop() || "Figma file"),
      subtitle: host,
    };
  }

  return {
    provider: "generic",
    label: "Link",
    accent: "var(--accent)",
    title: path.split("/").filter(Boolean).pop() || host,
    subtitle: host,
  };
}
