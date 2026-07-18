"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

/** Compact Clerk controls for the sidebar footer / header. */
export function AuthControls({ className = "" }: { className?: string }) {
  return (
    <div className={`auth-controls ${className}`.trim()}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button type="button" className="auth-btn">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button type="button" className="auth-btn auth-btn-primary">
            Sign up
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-7",
            },
          }}
        />
      </Show>
    </div>
  );
}
