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
      className="grid size-8 place-items-center rounded-full border border-foreground bg-foreground text-[0.7rem] font-bold text-background"
      title={props.afterSignOutUrl}
    >
      {demoUser.firstName?.[0] ?? "N"}
    </button>
  );
}

export function SignIn() {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="clerk-header-title m-0"
        style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
      >
        Sign in to NoteVault
      </p>
      <button type="button" className="clerk-social-btn h-10 w-full">
        Continue with Google
      </button>
      <input
        className="h-10 w-full border border-foreground bg-background px-3 text-sm"
        placeholder="Enter your email address"
        aria-label="Email address"
      />
      <button type="button" className="clerk-primary-btn h-10 w-full">
        Continue
      </button>
    </div>
  );
}

export function SignUp() {
  return (
    <div className="flex flex-col gap-3">
      <p
        className="clerk-header-title m-0"
        style={{ fontFamily: "var(--font-land-display), Calistoga, Georgia, serif" }}
      >
        Create your vault
      </p>
      <button type="button" className="clerk-social-btn h-10 w-full">
        Continue with Google
      </button>
      <input
        className="h-10 w-full border border-foreground bg-background px-3 text-sm"
        placeholder="Enter your email address"
        aria-label="Email address"
      />
      <button type="button" className="clerk-primary-btn h-10 w-full">
        Continue
      </button>
    </div>
  );
}

export function ClerkProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
