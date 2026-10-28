"use client"

import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

type Box = { top: number; left: number; width: number; height: number }

/**
 * One hover background for a whole list: it slides from row to row instead of
 * each row fading its own in and out. Rows opt in with `data-hover-row`; the
 * list spreads `listProps` and renders `highlight` as its first child.
 */
export function useSharedHover<T extends HTMLElement>() {
  const listRef = useRef<T>(null)
  const [box, setBox] = useState<Box | null>(null)
  const [shown, setShown] = useState(false)
  // Coming in from outside the list, the highlight appears in place rather than sliding from where it left.
  const [glide, setGlide] = useState(false)

  const onPointerMove = (event: React.PointerEvent) => {
    if (event.pointerType === "touch") return
    const list = listRef.current
    const row = (event.target as Element).closest<HTMLElement>("[data-hover-row]")
    // Between rows (the 1px gaps, the padding) the highlight stays where it is.
    if (!list || !row || !list.contains(row)) return
    const r = row.getBoundingClientRect()
    const l = list.getBoundingClientRect()
    const next = { top: r.top - l.top, left: r.left - l.left, width: r.width, height: r.height }
    setGlide(shown)
    setBox((prev) =>
      prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height
        ? prev
        : next
    )
    setShown(true)
  }

  const highlight = box && (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute top-0 left-0 -z-10 rounded-md bg-sidebar-hover transition-opacity duration-150 ease-out-quint motion-reduce:transition-none",
        glide && "transition-[opacity,translate,height]",
        // Out of the way while rows are being dragged.
        (!shown && "opacity-0") || "in-data-[canvas-sort]:opacity-0 in-data-[layer-drag]:opacity-0"
      )}
      style={{ translate: `${box.left}px ${box.top}px`, width: box.width, height: box.height }}
    />
  )

  return {
    listProps: { ref: listRef, onPointerMove, onPointerLeave: () => setShown(false) },
    highlight,
  }
}
