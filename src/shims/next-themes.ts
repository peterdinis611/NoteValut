/**
 * Compatibility shim — Turbopack / stale browser chunks may still request
 * `next-themes` after we removed the package. Route them to our provider.
 */
"use client";

export {
  ThemeProvider,
  useTheme,
  type Theme,
} from "@/components/theme/theme-provider";
