"use client";

import { Menu } from "@base-ui/react/menu";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/dashboard/actions";

function initialsFor(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
}

export function UserMenu({ name }: { name: string | null }) {
  const initials = initialsFor(name);

  return (
    <Menu.Root>
      <Menu.Trigger
        aria-label={name ? `${name} — account menu` : "Account menu"}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted/70"
        )}
      >
        {initials}
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} className="isolate z-50">
          <Menu.Popup className="min-w-36 origin-(--transform-origin) rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            {/* Extensible a "Profile" / "Settings" cuando Entra ID este disponible. */}
            <Menu.Item
              onClick={() => logout()}
              className="flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0"
            >
              <LogOut />
              Sign out
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
