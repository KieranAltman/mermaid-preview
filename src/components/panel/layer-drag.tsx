"use client"

import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import { moveToCanvas, moveToNewCanvas } from "@/lib/canvases"
import { useCanvasStore } from "@/lib/store"

/**
 * Dragging layer rows onto a canvas in the canvas list moves them there.
 * Pointer events rather than HTML drag and drop: the ghost can look like the
 * row and animate home or into its canvas, which a native drag image can't.
 *
 * Drop targets mark themselves with `data-drop-canvas` (a canvas id, or "new"
 * for the "新建画布" button); a collapsed list's header marks itself with
 * `data-drop-expand` and opens when a drag rests on it.
 */

type Target = { kind: "canvas"; id: string } | { kind: "new" }

type Drag = {
  ids: string[]
  label: string
  target: Target | null
  // Set once the pointer is up, while the ghost flies home or into a canvas.
  settling: boolean
}

const THRESHOLD = 4
// Pointer distance from the canvas list's top or bottom edge that scrolls it.
const EDGE = 24
const SPRING_LOAD_MS = 500
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)"
// Where the chip rides relative to the pointer: below and to the right, clear
// of whatever row the pointer is over, as a file does when dragged in the OS.
const RIDE = { x: -14, y: -14 }
const GLIDE_MS = 160

let drag: Drag | null = null
// The canvas a drop just landed on, so its count can acknowledge it.
let landed: { canvasId: string; at: number } | null = null
let ghost: HTMLElement | null = null
let ghostAt = { x: 0, y: 0 }
let swallowClick = false

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const emit = () => listeners.forEach((listener) => listener())

/** A slice of the drag; components re-render only when their slice changes. */
export function useLayerDrag<T>(select: (drag: Drag | null) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(drag),
    () => select(null)
  )
}

/** When a drop last landed on this canvas, or 0. */
export function useLanded(canvasId: string) {
  return useSyncExternalStore(
    subscribe,
    () => (landed?.canvasId === canvasId ? landed.at : 0),
    () => 0
  )
}

/** True once for the click that ends a drag, so the row doesn't also select. */
export function consumeDragClick() {
  const swallow = swallowClick
  swallowClick = false
  return swallow
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
const sameTarget = (a: Target | null, b: Target | null) =>
  a?.kind === b?.kind && (a?.kind !== "canvas" || a.id === (b as { id: string }).id)

/** Call from a layer row's pointerdown; the drag begins once the pointer travels a few pixels. */
export function startLayerDrag(event: React.PointerEvent<HTMLElement>, id: string) {
  // Touch scrolls the list instead; its long press opens the row menu, which can move too.
  if (event.button !== 0 || event.pointerType === "touch" || drag) return
  const source = event.currentTarget
  const start = { x: event.clientX, y: event.clientY }
  const box = source.getBoundingClientRect()
  // The chip starts where the row was held, then glides to ride beside the pointer.
  const grab = { x: start.x - box.left, y: start.y - box.top }
  let liftedAt = 0
  let pointer = start
  let frame = 0
  let springOn: Element | null = null
  let springTimer: ReturnType<typeof setTimeout> | undefined

  const place = () => {
    const t = reducedMotion() ? 1 : Math.min(1, (performance.now() - liftedAt) / GLIDE_MS)
    const eased = 1 - (1 - t) ** 4
    const offset = { x: grab.x + (RIDE.x - grab.x) * eased, y: grab.y + (RIDE.y - grab.y) * eased }
    ghostAt = { x: pointer.x - offset.x, y: pointer.y - offset.y }
    if (ghost) ghost.style.translate = `${ghostAt.x}px ${ghostAt.y}px`
  }

  const hitTest = () => {
    const under = document.elementFromPoint(pointer.x, pointer.y)
    const { currentCanvasId, setCanvasListOpen } = useCanvasStore.getState()
    const dropId = under?.closest<HTMLElement>("[data-drop-canvas]")?.dataset.dropCanvas
    const target: Target | null =
      dropId === "new"
        ? { kind: "new" }
        : dropId && dropId !== currentCanvasId
          ? { kind: "canvas", id: dropId }
          : null
    if (drag && !sameTarget(target, drag.target)) {
      drag = { ...drag, target }
      emit()
    }

    // Resting on a collapsed list's header opens it, like a spring-loaded folder.
    const expand = under?.closest("[data-drop-expand]") ?? null
    if (expand !== springOn) {
      clearTimeout(springTimer)
      springOn = expand
      if (expand) springTimer = setTimeout(() => setCanvasListOpen(true), SPRING_LOAD_MS)
    }
  }

  const autoScroll = () => {
    const viewport = document.querySelector<HTMLElement>("#canvas-list [data-slot=scroll-area-viewport]")
    if (!viewport) return
    const rect = viewport.getBoundingClientRect()
    if (pointer.x < rect.left || pointer.x > rect.right) return
    // Faster the deeper into the edge zone, up to ~8px a frame.
    const above = rect.top + EDGE - pointer.y
    const below = pointer.y - (rect.bottom - EDGE)
    if (above > 0 && above < EDGE * 2) viewport.scrollTop -= Math.ceil(above / 6)
    else if (below > 0 && below < EDGE * 2) viewport.scrollTop += Math.ceil(below / 6)
  }

  // Every frame, not just on moves: the list can scroll under a still pointer.
  const tick = () => {
    autoScroll()
    hitTest()
    place()
    frame = requestAnimationFrame(tick)
  }

  const begin = () => {
    const { selectedIds, diagrams } = useCanvasStore.getState()
    // A row inside the selection carries the whole selection, as its menu does.
    const ids = selectedIds.includes(id) ? selectedIds : [id]
    const label = ids.length === 1 ? (diagrams.find((d) => d.id === id)?.title ?? "") : `${ids.length} 张图表`
    drag = { ids, label, target: null, settling: false }
    liftedAt = performance.now()
    document.documentElement.dataset.layerDrag = ""
    window.getSelection()?.removeAllRanges()
    place()
    emit()
    frame = requestAnimationFrame(tick)
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== event.pointerId) return
    pointer = { x: e.clientX, y: e.clientY }
    if (!drag) {
      if (Math.hypot(pointer.x - start.x, pointer.y - start.y) < THRESHOLD) return
      begin()
    }
    place()
  }

  const stop = () => {
    window.removeEventListener("pointermove", onMove)
    window.removeEventListener("pointerup", onUp)
    window.removeEventListener("pointercancel", onCancel)
    window.removeEventListener("keydown", onKey, true)
    window.removeEventListener("blur", onCancel)
    cancelAnimationFrame(frame)
    clearTimeout(springTimer)
    delete document.documentElement.dataset.layerDrag
  }

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== event.pointerId) return
    stop()
    if (!drag) return
    // The click that follows a drag isn't a click; clear the flag if none comes.
    swallowClick = true
    setTimeout(() => (swallowClick = false))
    pointer = { x: e.clientX, y: e.clientY }
    hitTest()
    settle(drag.target, source)
  }

  const onCancel = () => {
    stop()
    if (drag) settle(null, source)
  }

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Escape" || !drag) return
    // Escape ends the drag only; the canvas would also clear the selection.
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

/** Drops into the target, or sends the ghost home, then ends the drag. */
function settle(target: Target | null, source: HTMLElement) {
  const current = drag!
  drag = { ...current, target, settling: true }
  emit()

  let to: DOMRect | null = null
  if (target) {
    const selector = `[data-drop-canvas="${target.kind === "new" ? "new" : CSS.escape(target.id)}"]`
    to = document.querySelector(selector)?.getBoundingClientRect() ?? null
    const canvasId = target.kind === "new" ? moveToNewCanvas(current.ids) : (moveToCanvas(current.ids, target.id), target.id)
    landed = { canvasId, at: Date.now() }
    setTimeout(() => {
      if (landed?.canvasId === canvasId) {
        landed = null
        emit()
      }
    }, 700)
  } else if (source.isConnected) {
    to = source.getBoundingClientRect()
  }

  const done = () => {
    drag = null
    emit()
  }
  if (!ghost || !to || reducedMotion()) return done()

  const from = `${ghostAt.x}px ${ghostAt.y}px`
  if (target) {
    // Into the canvas: toward its row's center, shrinking away as it arrives.
    const x = to.left + to.width / 2 - ghost.offsetWidth / 2
    const y = to.top + to.height / 2 - ghost.offsetHeight / 2
    ghost
      .animate(
        [
          { translate: from, scale: 1, opacity: 1 },
          { translate: `${x}px ${y}px`, scale: 0.5, opacity: 0 },
        ],
        { duration: 220, easing: EASE_OUT, fill: "forwards" }
      )
      .finished.then(done, done)
  } else {
    // Back to the row it came from, fading as it arrives.
    ghost
      .animate(
        [
          { translate: from, opacity: 1 },
          { translate: `${to.left}px ${to.top}px`, opacity: 0 },
        ],
        { duration: 200, easing: EASE_OUT, fill: "forwards" }
      )
      .finished.then(done, done)
  }
}

// Module-level, so it runs once per ghost rather than on every render.
function attachGhost(el: HTMLDivElement | null) {
  ghost = el
  if (!el) return
  el.style.translate = `${ghostAt.x}px ${ghostAt.y}px`
  if (!reducedMotion()) {
    el.animate([{ scale: 0.97, opacity: 0 }, { scale: 1, opacity: 1 }], { duration: 150, easing: EASE_OUT })
  }
}

/** The chip that follows the pointer. Rendered once, in the layers panel. */
export function LayerDragGhost() {
  const current = useLayerDrag((d) => d)
  if (!current) return null
  const many = current.ids.length > 1

  return createPortal(
    <div
      aria-hidden
      ref={attachGhost}
      className="pointer-events-none fixed top-0 left-0 z-50 max-w-48"
    >
      {/* A second card peeks out behind when more than one diagram is carried. */}
      {many && (
        <div className="absolute inset-0 translate-x-[3px] translate-y-[3px] rounded-md bg-popover shadow-sm ring-1 ring-foreground/10" />
      )}
      <div className="relative flex h-7 items-center gap-1.5 rounded-md bg-popover px-2 text-xs text-popover-foreground shadow-lg ring-1 ring-foreground/10">
        <span className="min-w-0 flex-1 truncate">{current.label}</span>
        {many && (
          <span className="shrink-0 rounded-full bg-selection px-1.5 text-[0.6875rem] leading-4 font-medium text-primary-foreground tabular-nums">
            {current.ids.length}
          </span>
        )}
      </div>
    </div>,
    document.body
  )
}
