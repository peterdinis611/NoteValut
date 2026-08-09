import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: ["../src/stories/**/*.mdx", "../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  async viteFinal(config) {
    config.resolve ??= {};
    const apiMock = path.resolve(dirname, "./mocks/convex-api.ts");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.resolve(dirname, "../src"),
      "convex/react": path.resolve(dirname, "./mocks/convex-react.tsx"),
      "convex/react-clerk": path.resolve(dirname, "./mocks/convex-react-clerk.tsx"),
      "@clerk/nextjs": path.resolve(dirname, "./mocks/clerk-nextjs.tsx"),
      [path.resolve(dirname, "../convex/_generated/api")]: apiMock,
      [path.resolve(dirname, "../convex/_generated/api.js")]: apiMock,
      [path.resolve(dirname, "../convex/_generated/api.d.ts")]: apiMock,
    };
    return config;
  },
};

export default config;
