import { SignInView } from "@/components/sign-in-view";

export default function SignInPage() {
  return (
    <main className="clerk-auth-page">
      <div className="clerk-auth-shell">
        <header className="clerk-auth-brand">
          <span className="clerk-auth-mark" aria-hidden>
            N
          </span>
          <div className="clerk-auth-brand-copy">
            <p className="clerk-auth-product">NoteVault</p>
            <p className="clerk-auth-tagline">Your personal knowledge vault</p>
          </div>
        </header>
        <SignInView />
      </div>
    </main>
  );
}
