import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

type ConvexMockBag = {
  /** Map of `module:fn` → query result (e.g. `notes:list`). */
  queries?: Record<string, unknown>;
  defaultQuery?: unknown;
};

const ConvexMockContext = createContext<ConvexMockBag>({});

export function StorybookConvexProvider({
  children,
  queries = {},
  defaultQuery,
}: ConvexMockBag & { children: ReactNode }) {
  const value = useMemo(
    () => ({ queries, defaultQuery }),
    [queries, defaultQuery],
  );
  return (
    <ConvexMockContext.Provider value={value}>{children}</ConvexMockContext.Provider>
  );
}

function refKey(ref: unknown): string {
  if (ref == null) return "";
  if (typeof ref === "string") return ref;
  if (typeof ref === "object" && ref !== null && "_name" in ref) {
    return String((ref as { _name: string })._name);
  }
  return "";
}

export function useQuery(ref: unknown, args?: unknown) {
  if (args === "skip") return undefined;
  const { queries, defaultQuery } = useContext(ConvexMockContext);
  const key = refKey(ref);
  if (key && queries && key in queries) return queries[key];
  return defaultQuery;
}

export function useMutation(ref?: unknown) {
  const key =
    ref && typeof ref === "object" && "_name" in ref
      ? String((ref as { _name: string })._name)
      : "";

  return async (...args: unknown[]) => {
    if (key === "files:generateUploadUrl") {
      return "https://example.com/upload";
    }
    if (key === "files:resolveUrl") {
      return "https://picsum.photos/seed/vault-upload/800/500";
    }
    return undefined;
  };
}

export function useAction(_ref?: unknown) {
  return async (..._args: unknown[]) => undefined;
}

export function useConvex() {
  return {
    query: async () => undefined,
    mutation: async () => undefined,
    action: async () => undefined,
  };
}

export function useConvexAuth() {
  return { isLoading: false, isAuthenticated: true };
}

export function usePaginatedQuery() {
  return {
    results: [] as unknown[],
    status: "Exhausted" as const,
    loadMore: (_n: number) => undefined,
    isLoading: false,
  };
}

export function ConvexProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function ConvexReactClient() {
  return {};
}
