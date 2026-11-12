import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function GlassCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("glass rounded-2xl", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-neon-cyan">{eyebrow}</div>}
        <h1 className="text-3xl font-extrabold italic sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint, icon, className }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-4 sm:p-5", className)}>
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="text-neon-cyan [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-2xl font-bold sm:text-3xl">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SideBadge({ side, label }: { side: "for" | "against"; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider",
        side === "for" ? "border-for/40 bg-for/10 text-for" : "border-against/40 bg-against/10 text-against",
      )}
    >
      {label ?? side}
    </span>
  );
}
