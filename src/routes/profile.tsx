import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ImagePlus, Loader2, Save, Trophy, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader, StatCard } from "@/components/voxora/ui";
import { UserAvatar } from "@/components/voxora/avatars";
import { LeagueBadge, LeagueProgressBlock } from "@/components/voxora/league";
import { useVoxora, type Profile } from "@/hooks/use-voxora";
import { supabase } from "@/integrations/supabase/client";
import { PRESET_AVATARS } from "@/lib/user-avatars";
import type { League } from "@/lib/league";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile – Voxora" },
      { name: "description", content: "Create your Voxora debater profile in seconds — no email or password. Pick a picture and a username." },
      { property: "og:title", content: "Your Profile – Voxora" },
      { property: "og:description", content: "Create your Voxora debater profile — no email or password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const MAX_AVATAR_CHARS = 150_000;

/** Center-crops and shrinks an uploaded image to a small JPEG data URL. */
async function fileToAvatar(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("That image is over 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Couldn't read that image."));
      el.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    for (const [size, quality] of [[256, 0.85], [200, 0.75], [160, 0.65]] as const) {
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      const data = canvas.toDataURL("image/jpeg", quality);
      if (data.length <= MAX_AVATAR_CHARS) return data;
    }
    throw new Error("That image is too detailed. Try another one.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ProfilePage() {
  const { profile, profileLoading } = useVoxora();
  return (
    <div>
      <PageHeader
        eyebrow="Profile"
        title={profile ? <>Your <span className="text-gradient-brand">debater</span> profile</> : <>Create your <span className="text-gradient-brand">profile</span></>}
        description={profile ? "Update how you appear on Voxora." : "No email, no password. Your profile is saved privately in this browser."}
      />
      {profileLoading ? (
        <Skeleton className="h-[480px] w-full rounded-3xl" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <ProfileForm key={profile?.id ?? "new"} profile={profile} />
          {profile ? <ProfileStats profile={profile} /> : <WhyProfile />}
        </div>
      )}
    </div>
  );
}

function ProfileForm({ profile }: { profile: Profile | null }) {
  const { ensureSession, refreshProfile } = useVoxora();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile?.avatar_url ?? null);
  const [showOnBoard, setShowOnBoard] = useState(profile?.show_on_leaderboard ?? false);
  const [saving, setSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => setUsernameError(null), [username]);

  const nameOk = displayName.trim().length >= 1 && displayName.trim().length <= 40;
  const usernameOk = USERNAME_RE.test(username);
  const dirty =
    !profile ||
    displayName.trim() !== profile.display_name ||
    username !== profile.username ||
    avatar !== profile.avatar_url ||
    showOnBoard !== profile.show_on_leaderboard;

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setAvatar(await fileToAvatar(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't use that image.");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!nameOk) return toast.error("Add a display name (up to 40 characters).");
    if (!usernameOk) return setUsernameError("3–20 characters: lowercase letters, numbers or _");
    setSaving(true);
    try {
      const values = { display_name: displayName.trim(), username, avatar_url: avatar, show_on_leaderboard: showOnBoard };
      let error;
      if (profile) {
        ({ error } = await supabase.from("profiles").update(values).eq("id", profile.id));
      } else {
        const id = await ensureSession();
        ({ error } = await supabase.from("profiles").insert({ id, ...values }));
      }
      if (error) {
        if (error.code === "23505") setUsernameError("That username is taken. Try another.");
        else toast.error("Couldn't save your profile. Please try again.");
        return;
      }
      await refreshProfile();
      toast.success(profile ? "Profile updated" : "Welcome to Voxora!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="glass space-y-7 rounded-3xl p-5 sm:p-7">
      <div className="flex items-center gap-5">
        <UserAvatar value={avatar} name={displayName} size="xl" />
        <div className="space-y-2">
          <div className="font-bold">Profile picture</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="glass" size="sm" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Upload your own
            </Button>
            {avatar && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}>
                <X /> Remove
              </Button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onUpload} aria-label="Upload a profile picture" />
        </div>
      </div>

      <div>
        <div className="mb-3 text-sm font-semibold text-muted-foreground">Or pick one</div>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {PRESET_AVATARS.map((a) => {
            const value = `preset:${a.id}`;
            const active = avatar === value;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAvatar(value)}
                aria-pressed={active}
                aria-label={a.label}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-2xl border-2 transition",
                  active ? "border-primary glow" : "border-transparent opacity-80 hover:opacity-100",
                )}
              >
                <img src={a.src} alt="" width={256} height={256} loading="lazy" className="size-full object-cover" />
                {active && (
                  <span className="absolute right-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="display-name">Display name</Label>
          <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} placeholder="e.g. Snikitha" className="h-11 bg-secondary/40" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              maxLength={20}
              placeholder="debate_queen"
              aria-invalid={!!usernameError}
              className="h-11 bg-secondary/40 pl-7"
            />
          </div>
          <p className={cn("text-xs", usernameError ? "text-destructive" : "text-muted-foreground")}>
            {usernameError ?? "3–20 characters: lowercase letters, numbers or _"}
          </p>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-2xl border border-glass-border bg-secondary/30 p-4">
        <div>
          <Label htmlFor="leaderboard" className="font-bold">Show me on the public leaderboard</Label>
          <p className="mt-1 text-sm text-muted-foreground">Others will see your picture, name, username, league and points. Off by default.</p>
        </div>
        <Switch id="leaderboard" checked={showOnBoard} onCheckedChange={setShowOnBoard} />
      </div>

      <Button type="submit" variant="hero" size="xl" className="w-full rounded-full sm:w-auto" disabled={saving || !dirty || !nameOk || username.length < 3}>
        {saving ? <Loader2 className="animate-spin" /> : <Save />} {profile ? "Save changes" : "Create profile"}
      </Button>
    </form>
  );
}

function WhyProfile() {
  return (
    <aside className="glass h-fit space-y-4 rounded-3xl p-6">
      <h2 className="text-lg font-bold">What you get</h2>
      <ul className="space-y-3 text-sm text-muted-foreground">
        <li>• Every debate and judge's report saved to your history</li>
        <li>• League points, from Bronze to Silver to Gold</li>
        <li>• Progress charts for your debating skills</li>
        <li>• An optional spot on the public leaderboard</li>
      </ul>
      <p className="rounded-xl border border-glass-border bg-secondary/30 p-3 text-xs text-muted-foreground">
        Your profile lives in this browser. Clearing your browser data will remove it.
      </p>
    </aside>
  );
}

function ProfileStats({ profile }: { profile: Profile }) {
  return (
    <aside className="h-fit space-y-4">
      <div className="glass-strong neon-border space-y-4 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-muted-foreground">Current league</span>
          <LeagueBadge league={profile.league} size="lg" />
        </div>
        <LeagueProgressBlock league={profile.league as League} debatesCompleted={profile.debates_completed} recentAvg={Number(profile.recent_avg_score)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Points" value={profile.points} />
        <StatCard label="Debates" value={profile.debates_completed} />
        <StatCard label="Avg score" value={Math.round(Number(profile.avg_score))} />
        <StatCard label="Recent avg" value={Math.round(Number(profile.recent_avg_score))} />
      </div>
      <Button asChild variant="glass" className="w-full rounded-full">
        <Link to="/leaderboard">
          <Trophy /> View leaderboard
        </Link>
      </Button>
    </aside>
  );
}
