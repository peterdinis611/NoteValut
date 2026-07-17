export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function notePreview(content: string, blocks?: { text: string; type: string }[], max = 80): string {
  if (blocks?.length) {
    const fromBlocks = blocks
      .filter((b) => b.type !== "divider" && b.text.trim())
      .map((b) => b.text)
      .join(" ")
      .trim();
    if (fromBlocks) {
      if (fromBlocks.length <= max) return fromBlocks;
      return `${fromBlocks.slice(0, max)}…`;
    }
  }

  const line = content.split("\n").find((l) => l.trim()) ?? "";
  if (line.length <= max) return line;
  return `${line.slice(0, max)}…`;
}
