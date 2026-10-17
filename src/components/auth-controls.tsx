"use client";

import {
  OrganizationSwitcher,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { SoftErrorBoundary } from "./soft-error-boundary";

/** Identity-first Clerk controls for the sidebar colophon. */
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
              rootBox: "nv-user-root",
              avatarBox: "nv-user-avatar",
              userButtonTrigger: "nv-user-trigger",
            },
          }}
        />
        {/* Orgs may be disabled in Clerk — never take down the vault chrome. */}
        <SoftErrorBoundary>
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
                organizationSwitcherTriggerIcon: "nv-org-chevron",
                organizationPreview: "nv-org-preview",
                organizationPreviewAvatarBox: "nv-org-avatar",
                organizationPreviewAvatarImage: "nv-org-avatar-img",
                organizationPreviewTextContainer: "nv-org-text",
                organizationPreviewMainIdentifier: "nv-org-name",
                organizationPreviewSecondaryIdentifier: "nv-org-secondary",
              },
            }}
          />
        </SoftErrorBoundary>
      </Show>
    </div>
  );
}
