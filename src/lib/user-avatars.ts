import a01 from "@/assets/avatars/avatar-01.jpg";
import a02 from "@/assets/avatars/avatar-02.jpg";
import a03 from "@/assets/avatars/avatar-03.jpg";
import a04 from "@/assets/avatars/avatar-04.jpg";
import a05 from "@/assets/avatars/avatar-05.jpg";
import a06 from "@/assets/avatars/avatar-06.jpg";
import a07 from "@/assets/avatars/avatar-07.jpg";
import a08 from "@/assets/avatars/avatar-08.jpg";
import a09 from "@/assets/avatars/avatar-09.jpg";
import a10 from "@/assets/avatars/avatar-10.jpg";
import a11 from "@/assets/avatars/avatar-11.jpg";
import a12 from "@/assets/avatars/avatar-12.jpg";

/** Built-in profile pictures. Stored on the profile as `preset:<id>`. */
export const PRESET_AVATARS: { id: string; src: string; label: string }[] = [
  { id: "hood-cyan", src: a01, label: "Cyan hood" },
  { id: "ink-shadow", src: a02, label: "Ink shadow" },
  { id: "neon-silver", src: a03, label: "Neon silver" },
  { id: "pink-bob", src: a04, label: "Pink bob" },
  { id: "emerald-gold", src: a05, label: "Emerald gold" },
  { id: "ink-profile", src: a06, label: "Ink profile" },
  { id: "crimson", src: a07, label: "Crimson" },
  { id: "saffron-braid", src: a08, label: "Saffron braid" },
  { id: "rain-cyan", src: a09, label: "Rain cyan" },
  { id: "lavender-varsity", src: a10, label: "Lavender varsity" },
  { id: "ink-beanie", src: a11, label: "Ink beanie" },
  { id: "neon-cat", src: a12, label: "Neon cat" },
];

export function resolveAvatar(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("preset:")) {
    const id = value.slice("preset:".length);
    return PRESET_AVATARS.find((a) => a.id === id)?.src ?? null;
  }
  if (value.startsWith("data:image/")) return value;
  return null;
}
