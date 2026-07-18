export const PAGE_ICON_GROUPS = [
  {
    id: "work",
    label: "Work",
    icons: [
      "📝", "📄", "📋", "📓", "📚", "📖", "📌", "📎", "🗂️", "📂",
      "📁", "💼", "📊", "📈", "📉", "🗓️", "📅", "⏰", "⏱️", "🔔",
    ],
  },
  {
    id: "ideas",
    label: "Ideas",
    icons: [
      "💡", "🧠", "✨", "🎯", "🚀", "⭐", "🌟", "💫", "🔮", "🪄",
      "🎨", "🖼️", "🎭", "🎬", "🎵", "🎶", "🎸", "🎹", "🎤", "🎧",
    ],
  },
  {
    id: "status",
    label: "Status",
    icons: [
      "✅", "☑️", "✔️", "❌", "⚠️", "🚧", "🔴", "🟠", "🟡", "🟢",
      "🔵", "🟣", "⚪", "⚫", "🔥", "💥", "⚡", "❄️", "🌈", "🏳️",
    ],
  },
  {
    id: "people",
    label: "People",
    icons: [
      "👤", "👥", "👨‍💻", "👩‍💻", "🧑‍🔬", "👨‍🏫", "👩‍🎨", "🤝", "👋", "🙌",
      "👍", "👎", "👏", "💪", "🙏", "❤️", "🧡", "💛", "💚", "💙",
    ],
  },
  {
    id: "places",
    label: "Places",
    icons: [
      "🏠", "🏢", "🏫", "🏥", "🏪", "🌍", "🌎", "🌏", "🗺️", "🧭",
      "✈️", "🚗", "🚌", "🚂", "🚲", "⛵", "🏔️", "🏖️", "🌴", "🗼",
    ],
  },
  {
    id: "tech",
    label: "Tech",
    icons: [
      "💻", "🖥️", "⌨️", "🖱️", "📱", "📲", "🔌", "🔋", "💾", "💿",
      "🛠️", "⚙️", "🔧", "🔨", "🧪", "🔬", "🔭", "📡", "🤖", "🧬",
    ],
  },
  {
    id: "fun",
    label: "Fun",
    icons: [
      "🎉", "🎊", "🎈", "🎁", "🎂", "🍰", "☕", "🍵", "🍕", "🍔",
      "🍎", "🌸", "🌻", "🍀", "🐱", "🐶", "🦊", "🐻", "🐼", "🦄",
    ],
  },
] as const;

export const PAGE_ICONS = PAGE_ICON_GROUPS.flatMap((g) => [...g.icons]);

/** Simple substring filter; prefer searchIcons from @/lib/search for fuzzy match. */
export function filterIcons(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return PAGE_ICON_GROUPS.map((g) => ({ ...g, icons: [...g.icons] }));

  return PAGE_ICON_GROUPS.map((g) => ({
    ...g,
    icons: g.icons.filter(
      (icon) =>
        icon.includes(q) ||
        g.label.toLowerCase().includes(q) ||
        g.id.includes(q),
    ),
  })).filter((g) => g.icons.length > 0);
}

