import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="clerk-auth-page">
      <div className="clerk-auth-brand">
        <span className="clerk-auth-mark" aria-hidden>
          N
        </span>
        <span>NoteVault</span>
      </div>
      <SignUp />
    </div>
  );
}
