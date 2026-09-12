import { AuthGate } from "@/components/auth-gate";
import { SignUpView } from "@/components/sign-up-view";

export default function SignUpPage() {
  return (
    <AuthGate
      mode="up"
      footer={
        <p className="clerk-auth-hint">
          Stuck on an old phone step?{" "}
          <a href="/sign-up?reset=1" className="clerk-auth-hint-link">
            Start over
          </a>
        </p>
      }
    >
      <SignUpView />
    </AuthGate>
  );
}
