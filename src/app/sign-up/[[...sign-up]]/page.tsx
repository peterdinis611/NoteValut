import { SignUpView } from "@/components/sign-up-view";

export default function SignUpPage() {
  return (
    <main className="clerk-auth-page">
      <div className="clerk-auth-shell">
        <header className="clerk-auth-brand">
          <span className="clerk-auth-mark" aria-hidden>
            N
          </span>
          <div className="clerk-auth-brand-copy">
            <p className="clerk-auth-product">NoteVault</p>
            <p className="clerk-auth-tagline">Create your vault account</p>
          </div>
        </header>
        <SignUpView />
        <p className="clerk-auth-hint">
          Stuck on an old phone step?{" "}
          <a href="/sign-up?reset=1" className="clerk-auth-hint-link">
            Start over
          </a>
        </p>
      </div>
    </main>
  );
}
