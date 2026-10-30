import { createAppwriteHandlers } from "@appwrite.io/react/handlers/next";
import {
  APPWRITE_SSR_BASE_PATH,
  getAppwriteApiKey,
  getAppwritePublicConfig,
} from "@/lib/appwrite/env";
import {
  isAuthSensitivePath,
  rateLimitPresets,
  withRateLimit,
} from "@/lib/rate-limit";

const { endpoint, projectId } = getAppwritePublicConfig();

const handlers = createAppwriteHandlers({
  endpoint,
  projectId,
  apiKey: getAppwriteApiKey(),
  basePath: APPWRITE_SSR_BASE_PATH,
});

export const GET = withRateLimit(handlers.GET, () => ({
  name: "api:appwrite:get",
  ...rateLimitPresets.apiGet,
}));

export const POST = withRateLimit(handlers.POST, (request) => {
  const pathname = new URL(request.url).pathname;
  const auth = isAuthSensitivePath(pathname);
  return {
    name: auth ? "api:appwrite:auth" : "api:appwrite:post",
    ...(auth ? rateLimitPresets.auth : rateLimitPresets.apiPost),
  };
});
