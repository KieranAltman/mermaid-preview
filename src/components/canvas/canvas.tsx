"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useShallow } from "zustand/react/shallow"

import { DiagramCard } from "@/components/canvas/diagram-card"
import { ZoomControls } from "@/components/canvas/zoom-controls"
import { CanvasEmptyState, CanvasHints } from "@/components/canvas/canvas-overlays"
import { useDiagramVars } from "@/hooks/use-diagram"
import { deleteDiagrams } from "@/lib/actions"
import { openEditor } from "@/lib/editor"
import { GRID_SIZE, MAX_ZOOM, MIN_ZOOM, snap, useCanvasStore } from "@/lib/store"
import { fitAll, fitDiagram, focusDiagram, resetZoom, stopViewportAnimation, zoomBy } from "@/lib/viewport"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }
type Rect = { x: number; y: number; width: number; height: number }

type Gesture =
  | { kind: "pan"; pointerId: number; start: Point; origin: Point; moved: boolean }
  | {
      kind: "drag"
      pointerId: number
      // The card under the pointer; snapping follows it and the rest keep their offsets.
      id: string
      start: Point
      origins: Record<string, Point>
      moved: boolean
      // A plain click on one card of a multi-selection narrows it to that card.
      narrowTo: string | null
    }
  | { kind: "marquee"; pointerId: number; start: Point; base: string[]; moved: boolean }
  | { kind: "pinch"; startDistance: number; startZoom: number; anchor: Point }

// Cards report their size after the first render; until then, assume this.
const FALLBACK_SIZE = { width: 320, height: 160 }

const rectFrom = (a: Point, b: Point): Rect => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
})

// Pixels a pointer has to travel before a press counts as a drag, not a click.
const DRAG_THRESHOLD = 3

// Enter on a focused button or menu item belongs to that control.
function isControl(target: EventTarget | null) {
  return target instanceof Element && !!target.closest("button, a, [role=menuitem], [role=option], [role=separator]")
}

function isEditable(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  )
}

export function Canvas() {
  const rootRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const pointers = useRef(new Map<number, Point>())
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [panning, setPanning] = useState(false)
  // The selection rectangle being dragged out, in canvas coordinates.
  const [marquee, setMarquee] = useState<Rect | null>(null)

  const ids = useCanvasStore(useShallow((s) => s.diagrams.map((d) => d.id)))
  const viewport = useCanvasStore((s) => s.viewport)
  const showGrid = useCanvasStore((s) => s.settings.showGrid)
  const vars = useDiagramVars()

  const toLocal = (event: { clientX: number; clientY: number }): Point => {
    const rect = rootRef.current!.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  useEffect(() => {
    const root = rootRef.current!
    const { setCanvasSize } = useCanvasStore.getState()
    const observer = new ResizeObserver(([entry]) =>
      setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height })
    )
    observer.observe(root)

    const localPoint = (event: { clientX: number; clientY: number }) => {
      const rect = root.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }

    // Chrome, Edge and Firefox report a trackpad pinch as ctrl+wheel. Listen on
    // window in the capture phase so nothing layered over the canvas can swallow
    // the event first; React's onWheel is passive and can't preventDefault.
    const onWheel = (event: WheelEvent) => {
      if (!(event.target instanceof Node) || !root.contains(event.target)) return
      event.preventDefault()
      stopViewportAnimation()
      const { viewport, setViewport, zoomAt } = useCanvasStore.getState()
      if (event.ctrlKey || event.metaKey) {
        // Trackpad pinches send small deltas; a mouse notch sends ~100. Clamp so
        // one notch zooms ~20% instead of jumping.
        const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
        const factor = Math.exp(-Math.max(-20, Math.min(20, delta)) * 0.01)
        zoomAt(viewport.zoom * factor, localPoint(event))
      } else {
        setViewport({ ...viewport, x: viewport.x - event.deltaX, y: viewport.y - event.deltaY })
      }
    }

    // Safari reports a trackpad pinch as non-standard gesture events instead.
    let gestureStartZoom = 1
    const onGestureStart = (event: Event) => {
      event.preventDefault()
      stopViewportAnimation()
      gestureStartZoom = useCanvasStore.getState().viewport.zoom
    }
    const onGestureChange = (event: Event) => {
      event.preventDefault()
      const gesture = event as Event & { scale: number; clientX: number; clientY: number }
      useCanvasStore.getState().zoomAt(gestureStartZoom * gesture.scale, localPoint(gesture))
    }
    const preventDefault = (event: Event) => event.preventDefault()

    window.addEventListener("wheel", onWheel, { passive: false, capture: true })
    root.addEventListener("gesturestart", onGestureStart)
    root.addEventListener("gesturechange", onGestureChange)
    root.addEventListener("gestureend", preventDefault)

    return () => {
      observer.disconnect()
      window.removeEventListener("wheel", onWheel, { capture: true })
      root.removeEventListener("gesturestart", onGestureStart)
      root.removeEventListener("gesturechange", onGestureChange)
      root.removeEventListener("gestureend", preventDefault)
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditable(event.target)) return
      const store = useCanvasStore.getState()
      const mod = event.metaKey || event.ctrlKey
      // The single selected diagram, for actions that only make sense on one.
      const selected = store.diagrams.find((d) => d.id === store.selectedId)
      const selectedIds = store.selectedIds
      // Shortcuts act instantly; animation would lag behind fast keyboard input.
      const instant = { animate: false }

      // Space on a focused button or menu item still activates it.
      if (event.code === "Space" && !isControl(event.target)) {
        event.preventDefault()
        setSpaceHeld(true)
      } else if (mod && (event.key === "=" || event.key === "+")) {
        event.preventDefault()
        zoomBy(1.25, instant)
      } else if (mod && event.key === "-") {
        event.preventDefault()
        zoomBy(0.8, instant)
      } else if (mod && event.key === "0") {
        event.preventDefault()
        resetZoom(instant)
      } else if (event.shiftKey && event.code === "Digit1") {
        fitAll(instant)
      } else if (event.shiftKey && event.code === "Digit2" && selected) {
        focusDiagram(selected.id, instant)
      } else if (event.key === "Escape") {
        store.setSelection([])
      } else if (mod && event.key.toLowerCase() === "a") {
        event.preventDefault()
        store.setSelection(store.diagrams.map((d) => d.id))
      } else if (selectedIds.length === 0) {
        return
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault()
        deleteDiagrams(selectedIds)
      } else if (event.key.startsWith("Arrow")) {
        event.preventDefault()
        const step = store.settings.snapToGrid ? GRID_SIZE : event.shiftKey ? 10 : 1
        const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0
        const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0
        store.moveDiagrams(
          Object.fromEntries(
            store.diagrams.filter((d) => selectedIds.includes(d.id)).map((d) => [d.id, { x: d.x + dx, y: d.y + dy }])
          )
        )
      } else if (!selected) {
        return
      } else if (event.key === "Enter" && !isControl(event.target)) {
        event.preventDefault()
        openEditor()
      } else if (mod && event.key.toLowerCase() === "d") {
        event.preventDefault()
        store.duplicateDiagram(selected.id, instant)
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpaceHeld(false)
    }
    const onBlur = () => setSpaceHeld(false)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      window.removeEventListener("blur", onBlur)
    }
  }, [])

  const startPinch = () => {
    const current = gesture.current
    // A second finger turns a selection drag into a pinch; drop the marquee.
    if (current?.kind === "marquee") {
      useCanvasStore.getState().setSelection(current.base)
      setMarquee(null)
    }
    const [a, b] = [...pointers.current.values()]
    const { viewport } = useCanvasStore.getState()
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    gesture.current = {
      kind: "pinch",
      startDistance: Math.hypot(a.x - b.x, a.y - b.y) || 1,
      startZoom: viewport.zoom,
      // The world point under the fingers stays under the fingers.
      anchor: { x: (mid.x - viewport.x) / viewport.zoom, y: (mid.y - viewport.y) / viewport.zoom },
    }
  }

  /** Diagrams whose card overlaps the rectangle (canvas coordinates). */
  const diagramsIn = (rect: Rect) => {
    const { diagrams, sizes, viewport } = useCanvasStore.getState()
    const left = (rect.x - viewport.x) / viewport.zoom
    const top = (rect.y - viewport.y) / viewport.zoom
    const right = left + rect.width / viewport.zoom
    const bottom = top + rect.height / viewport.zoom
    return diagrams
      .filter((d) => {
        const size = sizes[d.id] ?? FALLBACK_SIZE
        return d.x < right && d.x + size.width > left && d.y < bottom && d.y + size.height > top
      })
      .map((d) => d.id)
  }

  const onPointerDown = (event: React.PointerEvent) => {
    if (event.target instanceof Element && event.target.closest("[data-canvas-ui]")) return
    if (event.button === 2) return
    stopViewportAnimation()
    const point = toLocal(event)
    pointers.current.set(event.pointerId, point)
    rootRef.current!.setPointerCapture(event.pointerId)

    if (pointers.current.size === 2) {
      startPinch()
      return
    }
    if (pointers.current.size > 2) return

    const store = useCanvasStore.getState()

    // Space or the middle button pans, wherever the press lands.
    if (event.button === 1 || spaceHeld) {
      event.preventDefault()
      gesture.current = {
        kind: "pan",
        pointerId: event.pointerId,
        start: point,
        origin: { x: store.viewport.x, y: store.viewport.y },
        moved: false,
      }
      setPanning(true)
      return
    }

    const card = (event.target as Element).closest<HTMLElement>("[data-diagram-id]")
    if (!card) {
      // Empty canvas: drag out a selection. Shift adds to what's selected.
      const base = event.shiftKey ? store.selectedIds : []
      store.setSelection(base)
      gesture.current = { kind: "marquee", pointerId: event.pointerId, start: point, base, moved: false }
      return
    }

    const id = card.dataset.diagramId!
    let narrowTo: string | null = null
    if (event.shiftKey) {
      store.toggleSelection(id)
      // Shift-clicking a card out of the selection leaves nothing to drag.
      if (!useCanvasStore.getState().selectedIds.includes(id)) return
    } else if (store.selectedIds.includes(id) && store.selectedIds.length > 1) {
      // Keep the group so it can be dragged together.
      narrowTo = id
    } else {
      store.select(id)
    }

    const { diagrams, selectedIds } = useCanvasStore.getState()
    const origins = Object.fromEntries(
      diagrams.filter((d) => selectedIds.includes(d.id)).map((d) => [d.id, { x: d.x, y: d.y }])
    )
    gesture.current = { kind: "drag", pointerId: event.pointerId, id, start: point, origins, moved: false, narrowTo }
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return
    const point = toLocal(event)
    pointers.current.set(event.pointerId, point)
    const current = gesture.current
    if (!current) return
    const store = useCanvasStore.getState()

    if (current.kind === "pinch") {
      const [a, b] = [...pointers.current.values()]
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const scale = Math.hypot(a.x - b.x, a.y - b.y) / current.startDistance
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.startZoom * scale))
      store.setViewport({ zoom, x: mid.x - current.anchor.x * zoom, y: mid.y - current.anchor.y * zoom })
      return
    }
    if (event.pointerId !== current.pointerId) return

    const dx = point.x - current.start.x
    const dy = point.y - current.start.y
    if (!current.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    current.moved = true

    if (current.kind === "pan") {
      store.setViewport({ ...store.viewport, x: current.origin.x + dx, y: current.origin.y + dy })
    } else if (current.kind === "marquee") {
      const rect = rectFrom(current.start, point)
      setMarquee(rect)
      const hits = diagramsIn(rect)
      store.setSelection([...current.base, ...hits.filter((id) => !current.base.includes(id))])
    } else {
      // Move the grabbed card (snapping it if asked), then shift the rest by the same amount.
      const origin = current.origins[current.id]
      let x = origin.x + dx / store.viewport.zoom
      let y = origin.y + dy / store.viewport.zoom
      if (store.settings.snapToGrid) {
        x = snap(x)
        y = snap(y)
      }
      const shiftX = Math.round(x) - origin.x
      const shiftY = Math.round(y) - origin.y
      store.moveDiagrams(
        Object.fromEntries(
          Object.entries(current.origins).map(([id, o]) => [id, { x: o.x + shiftX, y: o.y + shiftY }])
        )
      )
    }
  }

  const onPointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId)
    const current = gesture.current
    if (current?.kind === "pinch") {
      // Lifting one finger ends the pinch; the other can't start a pan mid-gesture.
      if (pointers.current.size < 2) gesture.current = null
      return
    }
    if (current && event.pointerId === current.pointerId) {
      if (current.kind === "drag" && !current.moved && current.narrowTo && event.type === "pointerup") {
        useCanvasStore.getState().select(current.narrowTo)
      }
      gesture.current = null
      setPanning(false)
      setMarquee(null)
    }
  }

  const onDoubleClick = (event: React.MouseEvent) => {
    // Pointer capture retargets dblclick to the canvas root, so hit-test instead.
    const target = document.elementFromPoint(event.clientX, event.clientY)
    if (!target || target.closest("[data-canvas-ui]")) return
    const card = target.closest<HTMLElement>("[data-diagram-id]")
    if (card) fitDiagram(card.dataset.diagramId!)
  }

  // Thin the dots out when zoomed far out, so the grid never turns to noise.
  let gridStep = GRID_SIZE * viewport.zoom
  while (gridStep < 12) gridStep *= 2

  const style = {
    "--zoom": viewport.zoom,
    ...(showGrid && {
      backgroundImage: "radial-gradient(circle, var(--canvas-dot) 1px, transparent 1.5px)",
      backgroundSize: `${gridStep}px ${gridStep}px`,
      backgroundPosition: `${viewport.x - gridStep / 2}px ${viewport.y - gridStep / 2}px`,
    }),
  } as CSSProperties

  return (
    <main
      ref={rootRef}
      aria-label="画布"
      className={cn(
        "absolute inset-0 isolate touch-none overflow-hidden bg-canvas select-none",
        panning ? "cursor-grabbing" : spaceHeld ? "cursor-grab" : "cursor-default"
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className={cn("absolute top-0 left-0 origin-top-left", spaceHeld && "pointer-events-none")}
        style={
          {
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            ...vars,
          } as CSSProperties
        }
      >
        {ids.map((id) => (
          <DiagramCard key={id} id={id} />
        ))}
      </div>

      {marquee && (
        <div
          aria-hidden
          className="pointer-events-none absolute border border-selection bg-selection/8"
          style={{ left: marquee.x, top: marquee.y, width: marquee.width, height: marquee.height }}
        />
      )}
      {ids.length === 0 && <CanvasEmptyState />}
      <CanvasHints />
      <ZoomControls />
    </main>
  )
}
