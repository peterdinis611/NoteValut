"use client";

import {
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";

/** Compact Clerk controls for the sidebar account row. */
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
        <OrganizationSwitcher
          hidePersonal={false}
          afterCreateOrganizationUrl="/"
          afterSelectOrganizationUrl="/"
          appearance={{
            ...clerkAppearance,
            elements: {
              ...clerkAppearance.elements,
              rootBox: "nv-org-root",
              organizationSwitcherTrigger: "nv-org-trigger",
            },
          }}
        />
        <UserButton
          appearance={{
            elements: {
              rootBox: "nv-user-root",
              avatarBox: "nv-user-avatar",
              userButtonTrigger: "nv-user-trigger",
            },
          }}
        />
      </Show>
    </div>
  );
}
