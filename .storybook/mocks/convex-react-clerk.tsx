import type { ReactNode } from "react";

/** Storybook stub — real app wires Clerk auth into Convex. */
export function ConvexProviderWithClerk({
  children,
}: {
  client?: unknown;
  useAuth?: unknown;
  children: ReactNode;
}) {
  return <>{children}</>;
}
