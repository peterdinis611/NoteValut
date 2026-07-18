/** Resolve a pasted URL into something the NoteVault video viewer can play. */

export type VideoProvider =
  | "youtube"
  | "vimeo"
  | "loom"
  | "twitch"
  | "tiktok"
  | "dailymotion"
  | "streamable"
  | "wistia"
  | "file"
  | "unknown";

export type VideoAspect = "landscape" | "portrait" | "square";

export type VideoSource = {
  provider: VideoProvider;
  /** Original pasted URL */
  src: string;
  /** iframe embed URL when provider is hosted */
  embedUrl?: string;
  /** Direct media URL for native <video> */
  fileUrl?: string;
  label: string;
  aspect?: VideoAspect;
};

export type VideoProviderInfo = {
  id: VideoProvider;
  label: string;
  hint: string;
  example: string;
};

/** Shown in empty state / help UI. */
export const VIDEO_PROVIDER_CATALOG: VideoProviderInfo[] = [
  {
    id: "youtube",
    label: "YouTube",
    hint: "Videos, Shorts, live",
    example: "https://www.youtube.com/watch?v=…",
  },
  {
    id: "vimeo",
    label: "Vimeo",
    hint: "Public Vimeo links",
    example: "https://vimeo.com/…",
  },
  {
    id: "loom",
    label: "Loom",
    hint: "Share / embed links",
    example: "https://www.loom.com/share/…",
  },
  {
    id: "twitch",
    label: "Twitch",
    hint: "VODs and clips",
    example: "https://www.twitch.tv/videos/…",
  },
  {
    id: "tiktok",
    label: "TikTok",
    hint: "Public video links",
    example: "https://www.tiktok.com/@…/video/…",
  },
  {
    id: "dailymotion",
    label: "Dailymotion",
    hint: "Public video links",
    example: "https://www.dailymotion.com/video/…",
  },
  {
    id: "streamable",
    label: "Streamable",
    hint: "Short clips",
    example: "https://streamable.com/…",
  },
  {
    id: "wistia",
    label: "Wistia",
    hint: "medias / embed",
    example: "https://….wistia.com/medias/…",
  },
  {
    id: "file",
    label: "File",
    hint: "mp4, webm, mov, m3u8",
    example: "https://…/clip.mp4",
  },
];

const FILE_EXT = /\.(mp4|webm|ogg|mov|m4v|m3u8)(\?.*)?$/i;

export type ResolveVideoOptions = {
  /** Required by Twitch embeds (usually window.location.hostname). */
  parentHost?: string;
};

export function resolveVideoSource(
  raw: string,
  options: ResolveVideoOptions = {},
): VideoSource | null {
  const src = raw.trim();
  if (!src) return null;

  try {
    const u = new URL(src);
    const host = u.hostname.replace(/^www\./, "").toLowerCase();
    const parent = options.parentHost || "localhost";

    return (
      resolveYouTube(src, u, host) ||
      resolveVimeo(src, u, host) ||
      resolveLoom(src, u, host) ||
      resolveTwitch(src, u, host, parent) ||
      resolveTikTok(src, u, host) ||
      resolveDailymotion(src, u, host) ||
      resolveStreamable(src, u, host) ||
      resolveWistia(src, u, host) ||
      resolveFile(src, u)
    );
  } catch {
    return null;
  }
}

/** @deprecated Prefer resolveVideoSource */
export function youtubeEmbedUrl(url: string): string | null {
  return resolveVideoSource(url)?.embedUrl ?? null;
}

function resolveYouTube(src: string, u: URL, host: string): VideoSource | null {
  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0];
    if (!id) return null;
    return youtube(src, id, u.searchParams.get("list"));
  }
  if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com" ||
    host === "youtube-nocookie.com"
  ) {
    const list = u.searchParams.get("list");
    const id =
      u.searchParams.get("v") ||
      pathSegmentAfter(u.pathname, "embed") ||
      pathSegmentAfter(u.pathname, "shorts") ||
      pathSegmentAfter(u.pathname, "live") ||
      pathSegmentAfter(u.pathname, "v");
    if (id) return youtube(src, id, list);
    // Playlist-only URL
    if (list && u.pathname.includes("playlist")) {
      return {
        provider: "youtube",
        src,
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(list)}`,
        label: "YouTube",
        aspect: "landscape",
      };
    }
  }
  return null;
}

function youtube(src: string, id: string, list: string | null): VideoSource {
  const params = new URLSearchParams();
  if (list) params.set("list", list);
  const qs = params.toString();
  return {
    provider: "youtube",
    src,
    embedUrl: `https://www.youtube.com/embed/${id}${qs ? `?${qs}` : ""}`,
    label: "YouTube",
    aspect: "landscape",
  };
}

function resolveVimeo(src: string, u: URL, host: string): VideoSource | null {
  if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  // /video/123 or /123 or /channels/x/123
  const id = parts.includes("video")
    ? pathSegmentAfter(u.pathname, "video")
    : parts[parts.length - 1];
  if (!id || !/^\d+$/.test(id)) return null;
  const hash = u.searchParams.get("h");
  const embed = hash
    ? `https://player.vimeo.com/video/${id}?h=${encodeURIComponent(hash)}`
    : `https://player.vimeo.com/video/${id}`;
  return {
    provider: "vimeo",
    src,
    embedUrl: embed,
    label: "Vimeo",
    aspect: "landscape",
  };
}

function resolveLoom(src: string, u: URL, host: string): VideoSource | null {
  if (host !== "loom.com") return null;
  const id =
    pathSegmentAfter(u.pathname, "share") || pathSegmentAfter(u.pathname, "embed");
  if (!id) return null;
  return {
    provider: "loom",
    src,
    embedUrl: `https://www.loom.com/embed/${id}`,
    label: "Loom",
    aspect: "landscape",
  };
}

function resolveTwitch(
  src: string,
  u: URL,
  host: string,
  parent: string,
): VideoSource | null {
  if (host !== "twitch.tv" && host !== "clips.twitch.tv") return null;

  // clips.twitch.tv/ClipSlug or twitch.tv/user/clip/Slug
  if (host === "clips.twitch.tv") {
    const slug = u.pathname.split("/").filter(Boolean)[0];
    if (!slug) return null;
    return {
      provider: "twitch",
      src,
      embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&parent=${encodeURIComponent(parent)}`,
      label: "Twitch",
      aspect: "landscape",
    };
  }

  const clipSlug = pathSegmentAfter(u.pathname, "clip");
  if (clipSlug) {
    return {
      provider: "twitch",
      src,
      embedUrl: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(clipSlug)}&parent=${encodeURIComponent(parent)}`,
      label: "Twitch",
      aspect: "landscape",
    };
  }

  const videoId = pathSegmentAfter(u.pathname, "videos");
  if (videoId && /^\d+$/.test(videoId)) {
    return {
      provider: "twitch",
      src,
      embedUrl: `https://player.twitch.tv/?video=${encodeURIComponent(videoId)}&parent=${encodeURIComponent(parent)}`,
      label: "Twitch",
      aspect: "landscape",
    };
  }

  // Channel live player: twitch.tv/channelname
  const channel = u.pathname.split("/").filter(Boolean)[0];
  if (channel && !["directory", "videos", "clip", "downloads"].includes(channel)) {
    return {
      provider: "twitch",
      src,
      embedUrl: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parent)}`,
      label: "Twitch",
      aspect: "landscape",
    };
  }

  return null;
}

function resolveTikTok(src: string, u: URL, host: string): VideoSource | null {
  if (host !== "tiktok.com" && host !== "vm.tiktok.com") return null;
  // /@user/video/1234567890
  const id = pathSegmentAfter(u.pathname, "video");
  if (!id || !/^\d+$/.test(id)) return null;
  return {
    provider: "tiktok",
    src,
    embedUrl: `https://www.tiktok.com/embed/v2/${id}`,
    label: "TikTok",
    aspect: "portrait",
  };
}

function resolveDailymotion(src: string, u: URL, host: string): VideoSource | null {
  if (host !== "dailymotion.com" && host !== "dai.ly") return null;
  let id: string | null = null;
  if (host === "dai.ly") {
    id = u.pathname.split("/").filter(Boolean)[0] ?? null;
  } else {
    id = pathSegmentAfter(u.pathname, "video") || u.searchParams.get("video");
    // strip _title suffix: x7xxx_some-title → x7xxx
    if (id) id = id.split("_")[0];
  }
  if (!id) return null;
  return {
    provider: "dailymotion",
    src,
    embedUrl: `https://www.dailymotion.com/embed/video/${id}`,
    label: "Dailymotion",
    aspect: "landscape",
  };
}

function resolveStreamable(src: string, u: URL, host: string): VideoSource | null {
  if (host !== "streamable.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const id = parts[0] === "e" || parts[0] === "o" ? parts[1] : parts[0];
  if (!id) return null;
  return {
    provider: "streamable",
    src,
    embedUrl: `https://streamable.com/e/${id}`,
    label: "Streamable",
    aspect: "landscape",
  };
}

function resolveWistia(src: string, u: URL, host: string): VideoSource | null {
  const isWistia =
    host.endsWith("wistia.com") ||
    host.endsWith("wistia.net") ||
    host.endsWith("wi.st");
  if (!isWistia) return null;
  const id =
    pathSegmentAfter(u.pathname, "medias") ||
    pathSegmentAfter(u.pathname, "embed") ||
    pathSegmentAfter(u.pathname, "iframe") ||
    u.pathname.split("/").filter(Boolean).pop() ||
    null;
  if (!id) return null;
  return {
    provider: "wistia",
    src,
    embedUrl: `https://fast.wistia.net/embed/iframe/${id}`,
    label: "Wistia",
    aspect: "landscape",
  };
}

function resolveFile(src: string, u: URL): VideoSource | null {
  if (!FILE_EXT.test(u.pathname) && !FILE_EXT.test(src)) return null;
  return {
    provider: "file",
    src,
    fileUrl: src,
    label: u.pathname.toLowerCase().includes(".m3u8") ? "HLS stream" : "Video file",
    aspect: "landscape",
  };
}

function pathSegmentAfter(pathname: string, segment: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(segment);
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1].split("?")[0];
  return null;
}
