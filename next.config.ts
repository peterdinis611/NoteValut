import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@fluentui/react-components",
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
