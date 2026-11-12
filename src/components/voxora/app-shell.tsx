import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bot, History, Home, LayoutList, Menu, PlusCircle, Swords, Trophy, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useVoxora } from "@/hooks/use-voxora";
import { VoxoraLogo } from "./logo";
import { UserAvatar } from "./avatars";
import { LeagueBadge } from "./league";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/arena", label: "Create Debate", icon: PlusCircle },
  { to: "/opponents", label: "AI Opponents", icon: Bot },
  { to: "/topics", label: "Topics", icon: LayoutList },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/progress", label: "Your Progress", icon: BarChart3 },
  { to: "/history", label: "Debate History", icon: History },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1.5">
      {NAV.map((item) => {
        const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-semibold transition-all",
              active
                ? "bg-nav-active text-primary-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserCard({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, profileLoading } = useVoxora();
  if (profileLoading) return <div className="h-16 animate-pulse rounded-2xl bg-secondary/60" />;
  if (!profile) {
    return (
      <Link to="/profile" onClick={onNavigate} className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:border-primary/40">
        <UserAvatar value={null} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-semibold">Create your profile</div>
          <div className="text-xs text-muted-foreground">No email needed</div>
        </div>
      </Link>
    );
  }
  return (
    <Link to="/profile" onClick={onNavigate} className="glass flex items-center gap-3 rounded-2xl p-3 transition hover:border-primary/40">
      <UserAvatar value={profile.avatar_url} name={profile.display_name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{profile.display_name}</div>
        <div className="truncate text-xs text-muted-foreground">@{profile.username}</div>
      </div>
      <LeagueBadge league={profile.league} />
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:pl-72">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-glass-border bg-sidebar/80 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link to="/" className="mb-8 px-2">
          <VoxoraLogo />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <div className="pt-4">
          <UserCard />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-glass-border bg-background/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/">
          <VoxoraLogo showTagline={false} />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="glass" size="icon" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-[85vw] max-w-xs flex-col border-glass-border bg-sidebar p-4">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="mb-6 mt-2 px-2">
              <VoxoraLogo />
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setOpen(false)} />
            </div>
            <UserCard onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">{children}</main>
      <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-glass-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-2">
            <Swords className="size-4 text-neon-cyan" /> VOXORA — Think. Challenge. Debate. Improve.
          </span>
          <span>
            Made by <span className="font-semibold text-gradient-brand">Snikitha</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
