"use client"

import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

export function PanelIconButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label={label} onClick={onClick} />}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function Panel({
  side,
  label,
  className,
  children,
}: {
  side: "left" | "right"
  label: string
  className?: string
  children: ReactNode
}) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "z-20 flex h-dvh shrink-0 flex-col bg-sidebar text-sidebar-foreground max-md:absolute max-md:inset-y-0 max-md:w-[min(20rem,calc(100vw-3rem))] max-md:shadow-xl",
        "max-md:animate-in max-md:duration-250 max-md:ease-drawer",
        side === "left"
          ? "border-r max-md:left-0 max-md:slide-in-from-left"
          : "border-l max-md:right-0 max-md:slide-in-from-right",
        className
      )}
    >
      {children}
    </aside>
  )
}
