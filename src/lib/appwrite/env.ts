const required = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(
      `Missing ${name}. Copy .env.example to .env.local and fill in your Appwrite project values.`,
    );
  }
  return value;
};

/** Public Appwrite config safe to expose to the browser. */
export const getAppwritePublicConfig = () => ({
  endpoint: required(
    "NEXT_PUBLIC_APPWRITE_ENDPOINT",
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
  ),
  projectId: required(
    "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
  ),
});

/** Server-only API key used by SSR auth handlers. Never import from client components. */
export const getAppwriteApiKey = () =>
  required("APPWRITE_API_KEY", process.env.APPWRITE_API_KEY);

export const APPWRITE_SSR_BASE_PATH = "/api/appwrite";
