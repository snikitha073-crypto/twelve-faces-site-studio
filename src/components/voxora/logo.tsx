import { cn } from "@/lib/utils";

export function VoxoraMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden="true">
      <defs>
        <linearGradient id="vx-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon-violet)" />
          <stop offset="55%" stopColor="var(--neon-blue)" />
          <stop offset="100%" stopColor="var(--neon-cyan)" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="var(--card)" stroke="url(#vx-g)" strokeWidth="1.5" />
      <path d="M10 11 L20 29 L30 11" fill="none" stroke="url(#vx-g)" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="20" cy="11" r="2.4" fill="var(--neon-cyan)" />
    </svg>
  );
}

export function VoxoraLogo({ className, showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <VoxoraMark />
      <div className="leading-none">
        <div className="font-display text-xl font-extrabold italic tracking-tight text-gradient-brand">VOXORA</div>
        {showTagline && (
          <div className="mt-1 text-[10px] font-medium tracking-wide text-muted-foreground">
            Think. Challenge. Debate. Improve.
          </div>
        )}
      </div>
    </div>
  );
}
