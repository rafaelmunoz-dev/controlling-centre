import { cn } from "@/lib/utils";

/**
 * Design system has no dedicated success/warning tokens (Navy/Gold only),
 * so tier is conveyed by gold intensity: muted (0%), faint gold tint
 * (1-59%), solid gold (60-100%) — not by hue.
 */
export function PercentBadge({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const tier =
    value <= 0
      ? "bg-muted text-muted-foreground"
      : value < 60
        ? "bg-accent/15 text-foreground ring-1 ring-inset ring-accent/30"
        : "bg-accent text-accent-foreground";

  return (
    <span
      className={cn(
        "inline-flex min-w-14 justify-center rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        tier,
        className
      )}
    >
      {label}
    </span>
  );
}
