import type { NextConfig } from "next";

const ONE_YEAR = 60 * 60 * 24 * 365;
const ONE_DAY = 60 * 60 * 24;
const ONE_HOUR = 60 * 60;

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
] as const;

const nextConfig: NextConfig = {
  // Cache Components + Partial Prefetching (PPR shell + use cache)
  cacheComponents: true,
  partialPrefetching: true,

  // Playwright / local tooling hit the dev server via loopback hosts
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  // Named cacheLife profiles for `use cache` + cacheLife('…')
  cacheLife: {
    // Landing / SEO / static marketing payloads
    marketing: {
      stale: ONE_HOUR,
      revalidate: 15 * 60,
      expire: ONE_DAY,
    },
    // Rarely changing site chrome (icons, manifest-ish data)
    branding: {
      stale: ONE_DAY,
      revalidate: ONE_HOUR,
      expire: 7 * ONE_DAY,
    },
    // Short-lived public reads that can SWR
    minutes: {
      stale: 60,
      revalidate: 30,
      expire: 5 * 60,
    },
    // Near-static forever (override default max slightly tighter)
    max: {
      stale: ONE_DAY,
      revalidate: ONE_DAY,
      expire: 30 * ONE_DAY,
    },
  },

  // In-memory Data Cache / use-cache store per Node instance
  cacheMaxMemorySize: 64 * 1024 * 1024,

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  generateEtags: true,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: ONE_DAY,
    dangerouslyAllowSVG: false,
  },

  logging: {
    fetches: {
      fullUrl: true,
      hmrRefreshes: true,
    },
  },

  experimental: {
    // Client router segment cache (seconds) — keep vault/auth shells warm longer
    staleTimes: {
      dynamic: 180,
      static: 600,
    },
    // Tree-shake heavy barrels beyond the built-in defaults
    optimizePackageImports: [
      "lucide-react",
      "motion",
      "motion/react",
      "@xyflow/react",
      "@base-ui/react",
      "fuse.js",
      "cmdk",
    ],
    // Off while theme stack is custom — FS cache kept a ghost next-themes edge
    // after the package was removed ("module factory is not available").
    turbopackFileSystemCacheForDev: false,
    turbopackFileSystemCacheForBuild: true,
    // Keep Server Component fetch results across HMR
    serverComponentsHmrCache: true,
  },

  async headers() {
    // Never pin /_next/static as immutable in development — Turbopack HMR
    // reuses chunk URLs and browsers then serve stale module graphs (e.g. after
    // removing next-themes).
    const assetCacheHeaders =
      process.env.NODE_ENV === "production"
        ? ([
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: `public, max-age=${ONE_YEAR}, immutable`,
                },
              ],
            },
            {
              source: "/icon",
              headers: [
                {
                  key: "Cache-Control",
                  value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${7 * ONE_DAY}`,
                },
              ],
            },
            {
              source: "/apple-icon",
              headers: [
                {
                  key: "Cache-Control",
                  value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${7 * ONE_DAY}`,
                },
              ],
            },
            {
              source: "/opengraph-image",
              headers: [
                {
                  key: "Cache-Control",
                  value: `public, max-age=${ONE_HOUR}, stale-while-revalidate=${ONE_DAY}`,
                },
              ],
            },
          ] as const)
        : ([
            {
              // Force revalidation of HMR chunks — immutable pins caused
              // "module factory is not available" after package removals.
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "no-store, must-revalidate",
                },
              ],
            },
          ] as const);

    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
      ...assetCacheHeaders,
      {
        // Marketing shell can be CDN-cached briefly; RSC still streams dynamic bits
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: `public, s-maxage=${60}, stale-while-revalidate=${ONE_HOUR}`,
          },
        ],
      },
      {
        source: "/demo",
        headers: [
          {
            key: "Cache-Control",
            value: `public, s-maxage=${30}, stale-while-revalidate=${5 * 60}`,
          },
        ],
      },
      {
        // Auth + private app — never share
        source: "/vault",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
        ],
      },
      {
        source: "/login",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
        ],
      },
      {
        source: "/signup",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
        ],
      },
      {
        source: "/verify/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
        ],
      },
      {
        // Appwrite SSR proxy — never cache auth traffic
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-store, max-age=0",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_HOUR}, stale-while-revalidate=${ONE_DAY}`,
          },
        ],
      },
      {
        source: "/robots.txt",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_HOUR}, stale-while-revalidate=${ONE_DAY}`,
          },
        ],
      },
      {
        source: "/manifest.webmanifest",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${ONE_DAY}, stale-while-revalidate=${7 * ONE_DAY}`,
          },
        ],
      },
    ];
  },

  turbopack: {
    // Stale HMR / browser graphs may still import next-themes
    resolveAlias: {
      "next-themes": "./src/shims/next-themes.ts",
    },
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
