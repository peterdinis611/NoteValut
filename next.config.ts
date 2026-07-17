import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fluentui/react-components", "motion"],
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
};

export default nextConfig;
