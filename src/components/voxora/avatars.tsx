import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveAvatar } from "@/lib/user-avatars";
import { CHARACTER_AVATARS } from "@/lib/character-avatars";
import { getCharacter, type CharacterId } from "@/lib/characters";

const SIZES = { xs: "size-7", sm: "size-9", md: "size-12", lg: "size-20", xl: "size-28" } as const;

export function UserAvatar({
  value,
  name,
  size = "sm",
  className,
}: {
  value: string | null | undefined;
  name?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const src = resolveAvatar(value);
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-glass-border bg-secondary ring-2 ring-primary/30",
        SIZES[size],
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name ? `${name}'s profile picture` : "Profile picture"} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <UserRound className="size-1/2" />
        </div>
      )}
    </div>
  );
}

export function CharacterAvatar({
  id,
  size = "md",
  className,
}: {
  id: CharacterId | string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const character = getCharacter(id);
  const src = CHARACTER_AVATARS[id as CharacterId];
  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-2xl ring-2", character?.ringClass, SIZES[size], className)}>
      {src && <img src={src} alt={character?.name ?? "AI opponent"} className="size-full object-cover" loading="lazy" width={512} height={512} />}
    </div>
  );
}
