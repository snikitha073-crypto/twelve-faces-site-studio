import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { UserRoundPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVoxora } from "@/hooks/use-voxora";

/** Renders children only when the visitor has a profile; otherwise a friendly CTA. */
export function ProfileGate({ children, reason }: { children: ReactNode; reason: string }) {
  const { profile, profileLoading } = useVoxora();
  if (profileLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="glass mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <UserRoundPlus className="size-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Create your profile first</h2>
          <p className="mt-1 text-sm text-muted-foreground">{reason} It takes 20 seconds — no email or password.</p>
        </div>
        <Button asChild variant="hero" size="xl" className="rounded-full">
          <Link to="/profile">Create profile</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}
