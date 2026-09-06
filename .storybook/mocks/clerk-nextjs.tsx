import { createContext, useContext, useMemo, type ReactNode } from "react";

const demoUser = {
  id: "user_storybook",
  fullName: "Ada Lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  primaryEmailAddress: { emailAddress: "ada@notevault.dev" },
  imageUrl: "",
};

type ClerkMockState = {
  signedIn: boolean;
};

const ClerkMockContext = createContext<ClerkMockState>({ signedIn: true });

export function StorybookClerkState({
  signedIn = true,
  children,
}: {
  signedIn?: boolean;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ signedIn }), [signedIn]);
  return <ClerkMockContext.Provider value={value}>{children}</ClerkMockContext.Provider>;
}

function useSignedIn() {
  return useContext(ClerkMockContext).signedIn;
}

export function useUser() {
  const signedIn = useSignedIn();
  return {
    isLoaded: true,
    isSignedIn: signedIn,
    user: signedIn ? demoUser : null,
  };
}

export function useAuth() {
  const signedIn = useSignedIn();
  return {
    isLoaded: true,
    isSignedIn: signedIn,
    userId: signedIn ? demoUser.id : null,
    getToken: async () => (signedIn ? "storybook-token" : null),
    signOut: async () => undefined,
  };
}

export function useClerk() {
  return {
    signOut: async () => undefined,
    openUserProfile: () => undefined,
  };
}

export function SignedIn({ children }: { children: ReactNode }) {
  return useSignedIn() ? <>{children}</> : null;
}

export function SignedOut({ children }: { children?: ReactNode }) {
  return useSignedIn() ? null : <>{children}</>;
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: ReactNode;
}) {
  const signedIn = useSignedIn();
  if (when === "signed-in") return signedIn ? <>{children}</> : null;
  return signedIn ? null : <>{children}</>;
}

export function SignInButton({ children }: { mode?: string; children: ReactNode }) {
  return <>{children}</>;
}

export function SignUpButton({ children }: { mode?: string; children: ReactNode }) {
  return <>{children}</>;
}

export function UserButton(props: { afterSignOutUrl?: string; appearance?: unknown }) {
  return (
    <button
      type="button"
      className="rounded-full border border-border bg-panel px-3 py-1 text-xs text-muted"
      title={props.afterSignOutUrl}
    >
      {demoUser.firstName}
    </button>
  );
}

export function SignIn() {
  return (
    <div className="rounded-xl border border-border bg-panel p-6 text-sm text-muted">
      Clerk SignIn (mocked)
    </div>
  );
}

export function SignUp() {
  return (
    <div className="rounded-xl border border-border bg-panel p-6 text-sm text-muted">
      Clerk SignUp (mocked)
    </div>
  );
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
