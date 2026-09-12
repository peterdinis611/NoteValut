import { AuthGate } from "@/components/auth-gate";
import { SignInView } from "@/components/sign-in-view";

export default function SignInPage() {
  return (
    <AuthGate mode="in">
      <SignInView />
    </AuthGate>
  );
}
