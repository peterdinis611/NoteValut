"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@appwrite.io/react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={signOut.isPending}
      className={className}
      onClick={() =>
        signOut.signOut({
          onSuccess: () => {
            router.replace("/login");
            router.refresh();
          },
        })
      }
    >
      {signOut.isPending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
