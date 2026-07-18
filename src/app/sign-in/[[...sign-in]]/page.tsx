import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="clerk-auth-page">
      <div className="clerk-auth-brand">
        <span className="clerk-auth-mark" aria-hidden>
          N
        </span>
        <span>NoteVault</span>
      </div>
      <SignIn />
    </div>
  );
}
