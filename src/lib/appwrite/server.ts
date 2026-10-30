import { createNextServerHelpers } from "@appwrite.io/react/server/next";
import { getAppwritePublicConfig } from "./env";

/** Appwrite server helpers bound to this project's public config. */
export const createAppwriteServer = () =>
  createNextServerHelpers(getAppwritePublicConfig());
