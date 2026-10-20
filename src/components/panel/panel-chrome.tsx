"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** Holds the header slot that the panel toggle docks into. */
export function PanelToggleSlot() {
  return <div className="size-8 shrink-0" aria-hidden />
}

// Drawer recipe: slower in than out, sharing timing with everything that
// moves alongside the panel. Off until the first paint so nothing slides on load.
export const followPanelMotion =
  "transition-[translate] duration-200 ease-drawer data-open:duration-300 group-data-[ready=false]/studio:transition-none group-data-resizing/studio:transition-none"

export function Panel({
  side,
  label,
  open,
  children,
}: {
  side: "left" | "right"
  label: string
  open: boolean
  children: ReactNode
}) {
  return (
    <aside
      aria-label={label}
      data-state={open ? "open" : "closed"}
      // A closed panel is off screen; keep keyboard and screen readers out too.
      inert={!open}
      className={cn(
        "absolute inset-y-0 z-20 flex h-dvh flex-col bg-sidebar text-sidebar-foreground max-md:shadow-xl",
        followPanelMotion,
        side === "left"
          ? "left-0 w-(--layers-w) border-r data-closed:-translate-x-[calc(100%+2rem)]"
          : "right-0 w-(--inspector-w) border-l data-closed:translate-x-[calc(100%+2rem)]"
      )}
    >
      {children}
    </aside>
  )
}
