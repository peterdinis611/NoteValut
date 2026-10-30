"use client";

import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@appwrite.io/react";
import { LogOut, Mail, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || "NV").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function VaultProfile({
  accountLabel,
}: {
  accountLabel?: string | null;
}) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { signOut } = useAuth();

  const name = user?.name || accountLabel || "Guest";
  const email = user?.email || null;
  const verified = Boolean(user?.emailVerification);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            className="h-9 gap-2 rounded-full px-1.5 pr-2.5 hover:bg-muted"
          />
        }
      >
        <Avatar size="sm" className="bg-primary text-primary-foreground">
          <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
            {isLoading ? "…" : initials(user?.name, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[7.5rem] truncate text-[12px] font-medium text-muted-foreground sm:inline">
          {name}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2 py-2 font-normal">
            <div className="flex items-start gap-3">
              <Avatar className="bg-primary text-primary-foreground">
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {initials(user?.name, email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[15px] font-semibold tracking-tight">
                  {name}
                </p>
                {email ? (
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {email}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Local demo session
                  </p>
                )}
                <div className="mt-2">
                  {user ? (
                    verified ? (
                      <Badge
                        variant="secondary"
                        className="gap-1 rounded-full text-[10px]"
                      >
                        <ShieldCheck className="size-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 rounded-full border-primary/35 text-[10px] text-primary"
                      >
                        <Mail className="size-3" />
                        Unverified
                      </Badge>
                    )
                  ) : (
                    <Badge
                      variant="secondary"
                      className="rounded-full text-[10px]"
                    >
                      Guest
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        {!verified && user ? (
          <div className="px-2 pb-2">
            <ResendVerificationButton />
          </div>
        ) : null}

        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-xs text-muted-foreground">Appearance</span>
          <ThemeToggle compact />
        </div>

        <Separator className="my-1" />

        <DropdownMenuGroup>
          <DropdownMenuItem disabled className="gap-2 opacity-60">
            <UserRound className="size-3.5" />
            Profile settings
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="gap-2 opacity-60">
            <Settings2 className="size-3.5" />
            Preferences
            <span className="ml-auto text-[10px] text-muted-foreground">
              Soon
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {user ? (
            <DropdownMenuItem
              variant="destructive"
              className="gap-2"
              disabled={signOut.isPending}
              onClick={() =>
                signOut.signOut({
                  onSuccess: () => {
                    router.replace("/login");
                    router.refresh();
                  },
                })
              }
            >
              <LogOut className="size-3.5" />
              {signOut.isPending ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="gap-2"
              onClick={() => router.push("/login")}
            >
              <LogOut className="size-3.5" />
              Sign in
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
