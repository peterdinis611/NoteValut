import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Keep Tailwind's native Oxide binary out of the Turbopack bundle —
  // bundling it breaks dlopen ("file exists, but is not a Mach-O file").
  serverExternalPackages: [
    "@tailwindcss/postcss",
    "@tailwindcss/node",
    "@tailwindcss/oxide",
    "@tailwindcss/oxide-darwin-arm64",
    "@tailwindcss/oxide-darwin-x64",
    "@tailwindcss/oxide-linux-x64-gnu",
    "@tailwindcss/oxide-linux-arm64-gnu",
    "@tailwindcss/oxide-linux-x64-musl",
    "@tailwindcss/oxide-linux-arm64-musl",
    "@tailwindcss/oxide-win32-x64-msvc",
    "@tailwindcss/oxide-win32-arm64-msvc",
  ],
  transpilePackages: [
    "motion",
    "@embedpdf/core",
    "@embedpdf/engines",
    "@embedpdf/plugin-document-manager",
    "@embedpdf/plugin-viewport",
    "@embedpdf/plugin-scroll",
    "@embedpdf/plugin-render",
    "@embedpdf/plugin-zoom",
  ],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
