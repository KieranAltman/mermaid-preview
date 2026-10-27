"use client"

import type { ReactNode } from "react"

import {
  PANEL_WIDTH,
  PANEL_WIDTH_RANGE,
  dockedWidths,
  panelWidthRange,
  useCanvasStore,
  type PanelSide,
} from "@/lib/store"
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

const STEP = 16
const resizeLabel: Record<PanelSide, string> = { layers: "调整图层面板宽度", inspector: "调整属性面板宽度" }

/**
 * Drag the panel's inner edge to resize it; ←/→ on the focused handle step
 * 16px, a double-click restores the default. Desktop only: on phones the
 * panels are sheets with a fixed width.
 */
function ResizeHandle({ side }: { side: PanelSide }) {
  const width = useCanvasStore((s) => dockedWidths(s)[side])
  const maxWidth = useCanvasStore((s) => panelWidthRange(side, s).max)
  const setPanelWidth = useCanvasStore((s) => s.setPanelWidth)
  // The left panel grows rightward, the right one leftward.
  const direction = side === "layers" ? 1 : -1

  const resize = (next: number) => {
    const { min, max } = panelWidthRange(side, useCanvasStore.getState())
    setPanelWidth(side, Math.min(max, Math.max(min, next)))
  }

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // Keeps the drag from selecting text on its way across the panel.
    event.preventDefault()
    const handle = event.currentTarget
    const startX = event.clientX
    const startWidth = width
    handle.setPointerCapture(event.pointerId)
    // Everything that follows the panel tracks the handle directly while dragging.
    const studio = handle.closest<HTMLElement>(".studio")
    studio?.setAttribute("data-resizing", "")
    const move = (e: PointerEvent) => resize(startWidth + (e.clientX - startX) * direction)
    const end = () => {
      studio?.removeAttribute("data-resizing")
      handle.removeEventListener("pointermove", move)
      handle.removeEventListener("pointerup", end)
      handle.removeEventListener("pointercancel", end)
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", end)
    handle.addEventListener("pointercancel", end)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={resizeLabel[side]}
      aria-valuemin={PANEL_WIDTH_RANGE[side].min}
      aria-valuemax={maxWidth}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={startResize}
      onDoubleClick={() => resize(PANEL_WIDTH[side])}
      onKeyDown={(event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return
        event.preventDefault()
        resize(width + (event.key === "ArrowRight" ? STEP : -STEP) * direction)
      }}
      className={cn(
        // 8px to grab, centered on the panel's 1px border.
        "group/handle absolute inset-y-0 z-10 w-2 cursor-col-resize touch-none outline-none max-md:hidden",
        side === "layers" ? "-right-[4.5px]" : "-left-[4.5px]"
      )}
    >
      {/* The border lights up once the pointer settles on it, and at once while dragging or focused. */}
      <span className="absolute inset-y-0 left-[3px] w-0.5 bg-ring opacity-0 transition-opacity duration-150 group-hover/handle:opacity-100 group-hover/handle:delay-200 group-focus-visible/handle:opacity-100 group-focus-visible/handle:delay-0 group-active/handle:opacity-100 group-active/handle:delay-0" />
    </div>
  )
}

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
      <ResizeHandle side={side === "left" ? "layers" : "inspector"} />
    </aside>
  )
}
