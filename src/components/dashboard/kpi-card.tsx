import Link from "next/link";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  subtitle?: string;
  primaryValue?: string | number;
  primaryUnit?: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  href?: string;
  emptyMessage?: string;
};

export function KpiCard({
  title,
  subtitle,
  primaryValue,
  primaryUnit,
  secondaryValue,
  secondaryLabel,
  href,
  emptyMessage,
}: KpiCardProps) {
  const card = (
    <div
      className={cn(
        "flex h-48 flex-col rounded-xl border border-border bg-card p-6 shadow-sm",
        href && "cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      )}
    >
      <div>
        <h3 className="font-semibold text-primary">{title}</h3>
        {subtitle && (
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="mt-4 flex-1">
        {emptyMessage ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <>
            {primaryValue !== undefined && (
              <p className="text-4xl font-bold text-primary">
                {primaryValue}
                {primaryUnit && (
                  <span className="ml-1 text-lg font-medium text-muted-foreground">
                    {primaryUnit}
                  </span>
                )}
              </p>
            )}
            {secondaryValue && (
              <p className="mt-3 text-sm">
                <span className="font-medium text-accent">{secondaryValue}</span>
                {secondaryLabel && (
                  <span className="text-muted-foreground"> · {secondaryLabel}</span>
                )}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );

  if (!href) return card;

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  );
}
