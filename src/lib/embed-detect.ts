/** Detect known product URLs for richer embed cards + iframes. */

export type EmbedProvider =
  | "github"
  | "gist"
  | "notion"
  | "linear"
  | "figma"
  | "tweet"
  | "generic";

export type EmbedMeta = {
  provider: EmbedProvider;
  label: string;
  accent: string;
  title: string;
  subtitle: string;
  /** When set, render an interactive iframe instead of a static card */
  iframeSrc?: string;
  iframeHeight?: number;
};

export function detectEmbed(url: string): EmbedMeta {
  let host = "";
  let path = "";
  let search = "";
  try {
    const u = new URL(url);
    host = u.hostname.replace(/^www\./, "");
    path = u.pathname.replace(/\/$/, "");
    search = u.search;
  } catch {
    return {
      provider: "generic",
      label: "Link",
      accent: "var(--muted)",
      title: url || "Link",
      subtitle: "",
    };
  }

  // X / Twitter
  if (host === "twitter.com" || host === "x.com" || host === "mobile.twitter.com") {
    const parts = path.split("/").filter(Boolean);
    const statusIdx = parts.indexOf("status");
    const tweetId = statusIdx >= 0 ? parts[statusIdx + 1] : undefined;
    if (tweetId && /^\d+$/.test(tweetId)) {
      return {
        provider: "tweet",
        label: "Post",
        accent: "#1d9bf0",
        title: `@${parts[0] ?? "post"}`,
        subtitle: `Status ${tweetId}`,
        iframeSrc: `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&theme=dark`,
        iframeHeight: 420,
      };
    }
  }

  // GitHub Gist
  if (host === "gist.github.com") {
    const parts = path.split("/").filter(Boolean);
    const user = parts[0] ?? "";
    const gistId = parts[1] ?? "";
    return {
      provider: "gist",
      label: "Gist",
      accent: "#8b949e",
      title: gistId ? `${user}/${gistId.slice(0, 8)}` : user || "Gist",
      subtitle: host,
      iframeSrc: gistId ? `https://gist.github.com/${user}/${gistId}.pibb` : undefined,
      iframeHeight: 360,
    };
  }

  if (host === "github.com") {
    const parts = path.split("/").filter(Boolean);
    const title = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0] || "GitHub";
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
    const embedUrl = new URL("https://www.figma.com/embed");
    embedUrl.searchParams.set("embed_host", "notevault");
    embedUrl.searchParams.set("url", url.split("?")[0] + search);
    const name = decodeURIComponent(path.split("/").pop() || "Figma file");
    return {
      provider: "figma",
      label: "Figma",
      accent: "#a259ff",
      title: name,
      subtitle: host,
      iframeSrc: embedUrl.toString(),
      iframeHeight: 480,
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
