import { MAX_ZOOM, MIN_ZOOM, useCanvasStore, type Viewport } from "@/lib/store"

const FIT_MARGIN = 64
// Cards report their size after the first render; until then, assume this.
const FALLBACK_SIZE = { width: 320, height: 160 }

type Point = { x: number; y: number }

/**
 * Keyboard shortcuts move the camera instantly: the user is moving fast and
 * motion would lag behind their input. Pointer-initiated moves animate.
 */
export type CameraOptions = { animate?: boolean }

const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

// A zoom step is direct feedback to a click; traveling to another part of the
// canvas moves everything on screen at once, so it accelerates and brakes.
const STEP = { duration: 180, ease: easeOutQuart }
const TRAVEL = { duration: 300, ease: easeInOutCubic }

let frame = 0
// Where the running animation will land, so repeated zoom clicks build on the
// destination instead of on a mid-flight frame.
let pending: Viewport | null = null

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

function moveCamera(
  target: Viewport,
  { animate = true }: CameraOptions,
  motion: typeof STEP,
  // Screen point that stays over the same world point while zooming.
  anchor?: Point
) {
  const { viewport: from, setViewport } = useCanvasStore.getState()
  cancelAnimationFrame(frame)

  if (!animate || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    pending = null
    setViewport(target)
    return
  }

  pending = target
  const world = anchor && { x: (anchor.x - target.x) / target.zoom, y: (anchor.y - target.y) / target.zoom }
  const start = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / motion.duration)
    const eased = motion.ease(t)
    // Interpolate zoom geometrically so each frame scales by the same ratio.
    const zoom = from.zoom * Math.pow(target.zoom / from.zoom, eased)
    setViewport(
      world
        ? { zoom, x: anchor.x - world.x * zoom, y: anchor.y - world.y * zoom }
        : {
            zoom,
            x: from.x + (target.x - from.x) * eased,
            y: from.y + (target.y - from.y) * eased,
          }
    )
    if (t < 1) frame = requestAnimationFrame(step)
    else pending = null
  }
  frame = requestAnimationFrame(step)
}

function fitBounds(
  bounds: { x: number; y: number; width: number; height: number },
  maxZoom: number
): Viewport {
  const { canvasSize } = useCanvasStore.getState()
  const zoom = clampZoom(
    Math.min(
      maxZoom,
      (canvasSize.width - FIT_MARGIN * 2) / bounds.width,
      (canvasSize.height - FIT_MARGIN * 2) / bounds.height
    )
  )
  return {
    zoom,
    x: canvasSize.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: canvasSize.height / 2 - (bounds.y + bounds.height / 2) * zoom,
  }
}

export function stopViewportAnimation() {
  cancelAnimationFrame(frame)
  pending = null
}

export function focusDiagram(id: string, options: CameraOptions = {}) {
  const { diagrams, sizes, viewport } = useCanvasStore.getState()
  const diagram = diagrams.find((d) => d.id === id)
  if (!diagram) return
  const size = sizes[id] ?? FALLBACK_SIZE
  // Keep the current zoom unless the diagram wouldn't fit at it.
  const target = fitBounds({ x: diagram.x, y: diagram.y, ...size }, Math.max(viewport.zoom, 0.25))
  moveCamera(target, options, TRAVEL)
}

export function fitAll(options: CameraOptions = {}) {
  const { diagrams, sizes } = useCanvasStore.getState()
  if (diagrams.length === 0) {
    moveCamera({ x: 0, y: 0, zoom: 1 }, options, TRAVEL)
    return
  }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const d of diagrams) {
    const size = sizes[d.id] ?? FALLBACK_SIZE
    minX = Math.min(minX, d.x)
    minY = Math.min(minY, d.y)
    maxX = Math.max(maxX, d.x + size.width)
    maxY = Math.max(maxY, d.y + size.height)
  }
  moveCamera(fitBounds({ x: minX, y: minY, width: maxX - minX, height: maxY - minY }, 1), options, TRAVEL)
}

function zoomTo(zoom: number, options: CameraOptions) {
  const { viewport, canvasSize } = useCanvasStore.getState()
  const base = pending ?? viewport
  const center = { x: canvasSize.width / 2, y: canvasSize.height / 2 }
  const next = clampZoom(zoom)
  const ratio = next / base.zoom
  const target = {
    zoom: next,
    x: center.x - (center.x - base.x) * ratio,
    y: center.y - (center.y - base.y) * ratio,
  }
  moveCamera(target, options, STEP, center)
}

export function zoomBy(factor: number, options: CameraOptions = {}) {
  const base = pending ?? useCanvasStore.getState().viewport
  zoomTo(base.zoom * factor, options)
}

export function resetZoom(options: CameraOptions = {}) {
  zoomTo(1, options)
}
