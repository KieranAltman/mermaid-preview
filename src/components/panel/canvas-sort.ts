"use client"

import { useEffect, useRef, useState } from "react"

import { firstMovable, useCanvasStore } from "@/lib/store"

/**
 * Press and hold a canvas row to pick it up, then drag it to a new place in
 * the list. The rows it passes slide aside; on release it settles into the
 * gap and the order is saved. The default canvas stays on top and can't be
 * picked up. Mouse and pen only: on touch the list scrolls, and the row menu
 * has 上移 / 下移.
 */

const HOLD_MS = 300
// Travel before the hold completes cancels it: the press was a scroll or a select.
const SLOP = 4
// Pointer distance from the list's top or bottom edge that scrolls it.
const EDGE = 24
const SETTLE_MS = 150

export type Sort = {
  id: string
  from: number
  over: number
  // How far the row has been carried from its slot, scroll included.
  dy: number
  settling: boolean
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** `pitch` is the distance from one row's top to the next one's. */
export function useCanvasSort(pitch: number) {
  const [sort, setSort] = useState<Sort | null>(null)
  // One frame without transitions after a drop, so rows that changed places
  // in the DOM don't animate back from their old offsets.
  const [instant, setInstant] = useState(false)
  const swallowClick = useRef(false)

  useEffect(() => {
    if (!instant) return
    const frame = requestAnimationFrame(() => setInstant(false))
    return () => cancelAnimationFrame(frame)
  }, [instant])

  const press = (event: React.PointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0 || event.pointerType === "touch" || sort) return
    const { canvases } = useCanvasStore.getState()
    const from = canvases.findIndex((c) => c.id === id)
    const first = firstMovable(canvases)
    const last = canvases.length - 1
    if (from < first || first === last) return

    const viewport = event.currentTarget.closest<HTMLElement>("[data-slot=scroll-area-viewport]")
    const start = { x: event.clientX, y: event.clientY, scroll: viewport?.scrollTop ?? 0 }
    let pointerY = start.y
    let active = false
    let frame = 0
    let current: Sort | null = null
    const update = (next: Sort | null) => {
      current = next
      setSort(next)
    }

    const follow = () => {
      const scrolled = (viewport?.scrollTop ?? 0) - start.scroll
      const dy = clamp(pointerY - start.y + scrolled, (first - from) * pitch, (last - from) * pitch)
      const over = clamp(Math.round(from + dy / pitch), first, last)
      if (current && (current.dy !== dy || current.over !== over)) update({ ...current, dy, over })
    }

    const autoScroll = () => {
      if (!viewport) return
      const rect = viewport.getBoundingClientRect()
      const above = rect.top + EDGE - pointerY
      const below = pointerY - (rect.bottom - EDGE)
      if (above > 0) viewport.scrollTop -= Math.ceil(Math.min(above, EDGE * 2) / 6)
      else if (below > 0) viewport.scrollTop += Math.ceil(Math.min(below, EDGE * 2) / 6)
    }

    // Every frame, not just on moves: the list can scroll under a still pointer.
    const tick = () => {
      autoScroll()
      follow()
      frame = requestAnimationFrame(tick)
    }

    const hold = setTimeout(() => {
      active = true
      document.documentElement.dataset.canvasSort = ""
      window.getSelection()?.removeAllRanges()
      update({ id, from, over: from, dy: 0, settling: false })
      frame = requestAnimationFrame(tick)
    }, HOLD_MS)

    const stop = () => {
      clearTimeout(hold)
      cancelAnimationFrame(frame)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onCancel)
      window.removeEventListener("keydown", onKey, true)
      window.removeEventListener("blur", onCancel)
      delete document.documentElement.dataset.canvasSort
    }

    // Slides the row into its slot (or back home), then saves the order.
    const settle = (keep: boolean) => {
      const carried = current!
      const over = keep ? carried.over : carried.from
      update({ ...carried, over, dy: (over - carried.from) * pitch, settling: true })
      const done = () => {
        if (over !== carried.from) useCanvasStore.getState().moveCanvas(carried.id, over)
        setInstant(true)
        update(null)
      }
      if (reducedMotion()) done()
      else setTimeout(done, SETTLE_MS)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return
      if (active) pointerY = e.clientY
      else if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > SLOP) stop()
    }

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== event.pointerId) return
      stop()
      if (!active) return
      // The release lands on the row; that click isn't a switch to its canvas.
      swallowClick.current = true
      setTimeout(() => (swallowClick.current = false))
      settle(true)
    }

    const onCancel = () => {
      stop()
      if (active) settle(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !active) return
      // Escape puts the row back; it shouldn't also reach the canvas.
      e.preventDefault()
      e.stopPropagation()
      onCancel()
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onCancel)
    window.addEventListener("keydown", onKey, true)
    window.addEventListener("blur", onCancel)
  }

  /** How far the row at `index` sits from its slot while a row is carried. */
  const offset = (index: number) => {
    if (!sort) return 0
    if (index === sort.from) return sort.dy
    if (sort.from < sort.over && index > sort.from && index <= sort.over) return -pitch
    if (sort.from > sort.over && index >= sort.over && index < sort.from) return pitch
    return 0
  }

  const consumeClick = () => {
    const swallow = swallowClick.current
    swallowClick.current = false
    return swallow
  }

  return { sort, instant, press, offset, consumeClick }
}
