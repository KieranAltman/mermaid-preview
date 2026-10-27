import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { Look } from "@/lib/pele"
import { defaultTemplate, templates } from "@/lib/templates"

export const GRID_SIZE = 24
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4
// Default desktop panel widths; keep in sync with the fallbacks in globals.css.
export const PANEL_WIDTH = { layers: 256, inspector: 320 }
// How far each panel can be resized, and the canvas width docked panels must leave free.
export const PANEL_WIDTH_RANGE = { layers: { min: 224, max: 400 }, inspector: { min: 280, max: 480 } }
export const MIN_CANVAS_WIDTH = 480
// Below this the panels are temporary sheets over the canvas, not docked.
export const DESKTOP_QUERY = "(min-width: 768px)"

export type Diagram = {
  id: string
  canvasId: string
  title: string
  code: string
  x: number
  y: number
  z: number
}

export type Viewport = { x: number; y: number; zoom: number }

export type Canvas = {
  id: string
  name: string
  // Where the camera was left. The current canvas's live camera is `viewport`.
  viewport: Viewport
}

/** A deleted canvas with everything needed to put it back. */
export type RemovedCanvas = { canvas: Canvas; index: number; diagrams: Diagram[] }

export type Settings = {
  themeId: string
  fontSize: number
  padding: number
  showGrid: boolean
  snapToGrid: boolean
  look: Look
}

type Size = { width: number; height: number }

export type PanelSide = "layers" | "inspector"

type State = {
  canvases: Canvas[]
  currentCanvasId: string
  // Every canvas's diagrams; see currentDiagrams for the ones on screen.
  diagrams: Diagram[]
  // Every selected diagram, in selection order.
  selectedIds: string[]
  // The one diagram the inspector and editor work on: set only when exactly
  // one is selected.
  selectedId: string | null
  topZ: number
  viewport: Viewport
  settings: Settings
  panels: Record<PanelSide, boolean>
  canvasListOpen: boolean
  // The canvas list's dragged height; null fits it to its rows.
  canvasListHeight: number | null
  // The widths the user dragged the panels to; see dockedWidths for what is drawn.
  panelWidths: Record<PanelSide, number>
  editorHeight: number
  // Runtime only, not persisted.
  canvasSize: Size
  sizes: Record<string, Size>
  fonts: { sans: string; mono: string } | null
  // Recursive loads on first use of the hand-drawn look; Pele measures with it.
  handFontReady: boolean
  editorOpen: boolean
  // The diagram that should play its enter animation; null on page load.
  enteringId: string | null
}

type Actions = {
  addDiagram: (input?: {
    code?: string
    title?: string
    at?: { x: number; y: number }
    animate?: boolean
  }) => string
  updateDiagram: (id: string, patch: Partial<Omit<Diagram, "id">>) => void
  moveDiagram: (id: string, x: number, y: number) => void
  moveDiagrams: (positions: Record<string, { x: number; y: number }>) => void
  removeDiagrams: (ids: string[]) => Diagram[]
  restoreDiagrams: (diagrams: Diagram[]) => void
  duplicateDiagram: (id: string, options?: { animate?: boolean }) => string | undefined
  select: (id: string | null) => void
  setSelection: (ids: string[]) => void
  toggleSelection: (id: string) => void
  setViewport: (viewport: Viewport) => void
  addCanvas: (options?: { switchTo?: boolean }) => string
  renameCanvas: (id: string, name: string) => void
  switchCanvas: (id: string) => void
  removeCanvas: (id: string) => RemovedCanvas | null
  restoreCanvas: (removed: RemovedCanvas) => void
  moveDiagramsToCanvas: (ids: string[], canvasId: string) => void
  zoomAt: (zoom: number, point: { x: number; y: number }) => void
  updateSettings: (patch: Partial<Settings>) => void
  setPanel: (side: PanelSide, open: boolean) => void
  setPanelWidth: (side: PanelSide, width: number) => void
  setCanvasListOpen: (open: boolean) => void
  setCanvasListHeight: (height: number | null) => void
  setEditorOpen: (open: boolean) => void
  setEditorHeight: (height: number) => void
  setCanvasSize: (size: Size) => void
  setSize: (id: string, size: Size) => void
  setFonts: (fonts: { sans: string; mono: string }) => void
  setHandFontReady: () => void
}

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

const sides: PanelSide[] = ["layers", "inspector"]
const otherSide = (side: PanelSide): PanelSide => (side === "layers" ? "inspector" : "layers")
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

type PanelLayout = Pick<State, "panelWidths" | "panels" | "canvasSize">

// The canvas spans the window; before it is measured, the window stands in.
const roomForPanels = ({ canvasSize }: PanelLayout) =>
  (canvasSize.width || window.innerWidth) - MIN_CANVAS_WIDTH

/**
 * The widths the docked panels are drawn at. Each keeps the width it was given
 * while the window has room; in a narrow window the open ones give way
 * together, in proportion to how far each can still shrink, so the canvas
 * keeps MIN_CANVAS_WIDTH. No panel goes below its minimum.
 */
export function dockedWidths(state: PanelLayout): Record<PanelSide, number> {
  const { panelWidths, panels } = state
  const room = roomForPanels(state)
  const widths = { ...panelWidths }
  const open = sides.filter((side) => panels[side])
  const excess = open.reduce((sum, side) => sum + widths[side], 0) - room
  const slack = open.reduce((sum, side) => sum + widths[side] - PANEL_WIDTH_RANGE[side].min, 0)
  if (excess > 0 && slack > 0) {
    const share = Math.min(1, excess / slack)
    for (const side of open) widths[side] -= (widths[side] - PANEL_WIDTH_RANGE[side].min) * share
  }
  // A closed panel opens into whatever the open one leaves.
  for (const side of sides.filter((s) => !panels[s])) {
    const { min } = PANEL_WIDTH_RANGE[side]
    const other = otherSide(side)
    widths[side] = clamp(widths[side], min, Math.max(min, room - (panels[other] ? widths[other] : 0)))
  }
  return { layers: Math.round(widths.layers), inspector: Math.round(widths.inspector) }
}

/** The range a panel can be dragged across right now, given the window and the other panel. */
export function panelWidthRange(side: PanelSide, state: PanelLayout) {
  const { min, max } = PANEL_WIDTH_RANGE[side]
  const other = otherSide(side)
  const taken = state.panels[other] ? dockedWidths(state)[other] : 0
  return { min, max: clamp(roomForPanels(state) - taken, min, max) }
}

/**
 * The part of the canvas not covered by docked panels, in canvas coordinates.
 * The canvas always spans the full window and the panels float over it.
 */
export function visibleArea(state: PanelLayout & Pick<State, "editorOpen" | "editorHeight">) {
  const { canvasSize, panels, editorOpen, editorHeight } = state
  const docked = window.matchMedia(DESKTOP_QUERY).matches
  const widths = dockedWidths(state)
  const left = docked && panels.layers ? widths.layers : 0
  const right = docked && panels.inspector ? widths.inspector : 0
  const bottom = editorOpen ? editorHeight : 0
  return { x: left, y: 0, width: canvasSize.width - left - right, height: canvasSize.height - bottom }
}

export const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

function selection(ids: string[]) {
  return { selectedIds: ids, selectedId: ids.length === 1 ? ids[0] : null }
}

/** The diagrams on the current canvas. */
export function currentDiagrams({ diagrams, currentCanvasId }: Pick<State, "diagrams" | "currentCanvasId">) {
  return diagrams.filter((d) => d.canvasId === currentCanvasId)
}

function nextName(taken: string[], prefix: string) {
  let n = taken.length + 1
  while (taken.includes(`${prefix} ${n}`)) n++
  return `${prefix} ${n}`
}

/**
 * Leaves the current canvas for another: its camera is kept for next time,
 * and the selection and editor belong to the canvas being left.
 */
function switchTo(state: State, id: string): Partial<State> {
  const target = state.canvases.find((c) => c.id === id)
  if (!target || id === state.currentCanvasId) return {}
  return {
    canvases: state.canvases.map((c) => (c.id === state.currentCanvasId ? { ...c, viewport: state.viewport } : c)),
    currentCanvasId: id,
    viewport: target.viewport,
    ...selection([]),
    editorOpen: false,
    enteringId: null,
  }
}

// Nudge a new diagram away from any diagram sitting at the same spot so
// repeated "new" clicks fan out instead of stacking invisibly.
function freeSpot(diagrams: Diagram[], x: number, y: number) {
  while (diagrams.some((d) => Math.abs(d.x - x) < 8 && Math.abs(d.y - y) < 8)) {
    x += GRID_SIZE * 2
    y += GRID_SIZE * 2
  }
  return { x, y }
}

const DEFAULT_CANVAS: Canvas = { id: "default", name: "默认画布", viewport: { x: 0, y: 0, zoom: 1 } }

const seed: Diagram[] = [
  {
    id: "welcome",
    canvasId: DEFAULT_CANVAS.id,
    title: "欢迎",
    code: `flowchart LR
  A[新建图表] --> B[在底部编辑代码]
  B --> C[双击图表居中]
  C --> D[拖拽整理画布]`,
    x: 96,
    y: 96,
    z: 1,
  },
  {
    id: "sequence-sample",
    canvasId: DEFAULT_CANVAS.id,
    title: "登录流程",
    code: templates.find((t) => t.id === "sequence")!.code,
    x: 96,
    y: 288,
    z: 2,
  },
]

export const useCanvasStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      canvases: [DEFAULT_CANVAS],
      currentCanvasId: DEFAULT_CANVAS.id,
      diagrams: seed,
      ...selection(["welcome"]),
      topZ: seed.length,
      viewport: { x: 0, y: 0, zoom: 1 },
      settings: {
        themeId: "neutral",
        fontSize: 16,
        padding: 16,
        showGrid: true,
        snapToGrid: false,
        look: "classic",
      },
      panels: { layers: true, inspector: true },
      canvasListOpen: true,
      canvasListHeight: null,
      panelWidths: PANEL_WIDTH,
      editorHeight: 300,
      canvasSize: { width: 0, height: 0 },
      sizes: {},
      fonts: null,
      handFontReady: false,
      editorOpen: false,
      enteringId: null,

      addDiagram: (input = {}) => {
        const { viewport, topZ, settings, currentCanvasId } = get()
        const diagrams = currentDiagrams(get())
        const id = crypto.randomUUID()
        // Default to the center of the uncovered canvas, in world coordinates.
        const area = visibleArea(get())
        let at = input.at ?? {
          x: (area.x + area.width / 2 - viewport.x) / viewport.zoom - 160,
          y: (area.y + area.height / 2 - viewport.y) / viewport.zoom - 80,
        }
        if (settings.snapToGrid) at = { x: snap(at.x), y: snap(at.y) }
        const spot = freeSpot(diagrams, Math.round(at.x), Math.round(at.y))
        const diagram: Diagram = {
          id,
          canvasId: currentCanvasId,
          title: input.title ?? nextName(diagrams.map((d) => d.title), "图表"),
          code: input.code ?? defaultTemplate.code,
          ...spot,
          z: topZ + 1,
        }
        set((state) => ({
          diagrams: [...state.diagrams, diagram],
          ...selection([id]),
          topZ: topZ + 1,
          enteringId: input.animate === false ? null : id,
        }))
        return id
      },

      updateDiagram: (id, patch) =>
        set((state) => ({
          diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      moveDiagram: (id, x, y) =>
        set((state) => ({
          diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, x, y } : d)),
        })),

      moveDiagrams: (positions) =>
        set((state) => ({
          diagrams: state.diagrams.map((d) => (positions[d.id] ? { ...d, ...positions[d.id] } : d)),
        })),

      removeDiagrams: (ids) => {
        const removed = get().diagrams.filter((d) => ids.includes(d.id))
        set((state) => ({
          diagrams: state.diagrams.filter((d) => !ids.includes(d.id)),
          ...selection(state.selectedIds.filter((id) => !ids.includes(id))),
        }))
        return removed
      },

      restoreDiagrams: (restored) =>
        set((state) => {
          // Back onto the canvas they came from, which comes into view so the
          // undo is seen; if that canvas is gone too, onto the current one.
          const home = restored[0] && state.canvases.find((c) => c.id === restored[0].canvasId)
          const canvasId = home?.id ?? state.currentCanvasId
          return {
            ...switchTo(state, canvasId),
            diagrams: [...state.diagrams, ...restored.map((d) => ({ ...d, canvasId }))],
            ...selection(restored.map((d) => d.id)),
            // A single undo plays the card's entrance; a batch just reappears.
            enteringId: restored.length === 1 ? restored[0].id : null,
          }
        }),

      duplicateDiagram: (id, options = {}) => {
        const source = get().diagrams.find((d) => d.id === id)
        if (!source) return
        return get().addDiagram({
          code: source.code,
          title: `${source.title} 副本`,
          at: { x: source.x + GRID_SIZE * 2, y: source.y + GRID_SIZE * 2 },
          animate: options.animate,
        })
      },

      select: (id) =>
        set((state) => {
          if (id === null) return selection([])
          const topZ = state.topZ + 1
          return {
            ...selection([id]),
            topZ,
            diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, z: topZ } : d)),
          }
        }),

      setSelection: (ids) =>
        set((state) => {
          const same = ids.length === state.selectedIds.length && ids.every((id, i) => id === state.selectedIds[i])
          return same ? {} : selection(ids)
        }),

      toggleSelection: (id) =>
        set((state) => {
          if (state.selectedIds.includes(id)) return selection(state.selectedIds.filter((s) => s !== id))
          const topZ = state.topZ + 1
          return {
            ...selection([...state.selectedIds, id]),
            topZ,
            diagrams: state.diagrams.map((d) => (d.id === id ? { ...d, z: topZ } : d)),
          }
        }),

      setViewport: (viewport) => set({ viewport: { ...viewport, zoom: clampZoom(viewport.zoom) } }),

      addCanvas: ({ switchTo: show = true } = {}) => {
        const id = crypto.randomUUID()
        set((state) => {
          const canvas: Canvas = {
            id,
            name: nextName(
              state.canvases.map((c) => c.name),
              "画布"
            ),
            // Start beside the docked layers panel, as a first visit does.
            viewport: { x: visibleArea(state).x, y: 0, zoom: 1 },
          }
          const next = { ...state, canvases: [...state.canvases, canvas] }
          return show ? { ...next, ...switchTo(next, id) } : next
        })
        return id
      },

      renameCanvas: (id, name) =>
        set((state) => {
          // An emptied name keeps the old one.
          const trimmed = name.trim()
          if (!trimmed) return {}
          return { canvases: state.canvases.map((c) => (c.id === id ? { ...c, name: trimmed } : c)) }
        }),

      switchCanvas: (id) => set((state) => switchTo(state, id)),

      removeCanvas: (id) => {
        const state = get()
        const index = state.canvases.findIndex((c) => c.id === id)
        // There is always at least one canvas.
        if (index === -1 || state.canvases.length === 1) return null
        const canvas = id === state.currentCanvasId ? { ...state.canvases[index], viewport: state.viewport } : state.canvases[index]
        const removed = { canvas, index, diagrams: state.diagrams.filter((d) => d.canvasId === id) }
        set((state) => {
          // Leaving the current canvas lands on its neighbor below, or above for the last one.
          const neighbor = state.canvases[index + 1] ?? state.canvases[index - 1]
          const left = id === state.currentCanvasId ? switchTo(state, neighbor.id) : {}
          return {
            ...left,
            canvases: (left.canvases ?? state.canvases).filter((c) => c.id !== id),
            diagrams: state.diagrams.filter((d) => d.canvasId !== id),
          }
        })
        return removed
      },

      restoreCanvas: ({ canvas, index, diagrams }) =>
        set((state) => {
          const canvases = [...state.canvases]
          canvases.splice(Math.min(index, canvases.length), 0, canvas)
          const next = { ...state, canvases, diagrams: [...state.diagrams, ...diagrams] }
          return { ...next, ...switchTo(next, canvas.id) }
        }),

      moveDiagramsToCanvas: (ids, canvasId) =>
        set((state) => {
          const target = state.canvases.find((c) => c.id === canvasId)
          const moving = state.diagrams.filter((d) => ids.includes(d.id) && d.canvasId !== canvasId)
          if (!target || moving.length === 0) return {}
          // Land the group, laid out as it was, in the middle of the target's
          // view, then step it off any diagram already sitting there.
          const viewport = canvasId === state.currentCanvasId ? state.viewport : target.viewport
          const area = visibleArea(state)
          const sizeOf = (d: Diagram) => state.sizes[d.id] ?? { width: 320, height: 160 }
          const left = Math.min(...moving.map((d) => d.x))
          const top = Math.min(...moving.map((d) => d.y))
          const right = Math.max(...moving.map((d) => d.x + sizeOf(d).width))
          const bottom = Math.max(...moving.map((d) => d.y + sizeOf(d).height))
          let dx = Math.round((area.x + area.width / 2 - viewport.x) / viewport.zoom - (left + right) / 2)
          let dy = Math.round((area.y + area.height / 2 - viewport.y) / viewport.zoom - (top + bottom) / 2)
          if (state.settings.snapToGrid) {
            dx = snap(left + dx) - left
            dy = snap(top + dy) - top
          }
          const there = state.diagrams.filter((d) => d.canvasId === canvasId)
          const collides = () =>
            moving.some((m) => there.some((d) => Math.abs(d.x - (m.x + dx)) < 8 && Math.abs(d.y - (m.y + dy)) < 8))
          while (collides()) {
            dx += GRID_SIZE * 2
            dy += GRID_SIZE * 2
          }
          const moved = new Set(moving.map((d) => d.id))
          return {
            diagrams: state.diagrams.map((d) => (moved.has(d.id) ? { ...d, canvasId, x: d.x + dx, y: d.y + dy } : d)),
            ...selection(state.selectedIds.filter((id) => !moved.has(id))),
          }
        }),

      zoomAt: (zoom, point) => {
        const { viewport } = get()
        const next = clampZoom(zoom)
        // Keep the world point under `point` fixed while scaling.
        const ratio = next / viewport.zoom
        set({
          viewport: {
            zoom: next,
            x: point.x - (point.x - viewport.x) * ratio,
            y: point.y - (point.y - viewport.y) * ratio,
          },
        })
      },

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      setPanel: (side, open) =>
        set((state) => {
          if (state.panels[side] === open) return {}
          const panels = { ...state.panels, [side]: open }
          // On phones the panels cover most of the canvas, so only one fits at a time.
          if (open && !window.matchMedia(DESKTOP_QUERY).matches) {
            panels[side === "layers" ? "inspector" : "layers"] = false
          }
          return { panels }
        }),
      setPanelWidth: (side, width) =>
        set((state) => ({
          panelWidths: {
            ...state.panelWidths,
            [side]: Math.round(clamp(width, PANEL_WIDTH_RANGE[side].min, PANEL_WIDTH_RANGE[side].max)),
          },
        })),
      setCanvasListOpen: (canvasListOpen) => set({ canvasListOpen }),
      setCanvasListHeight: (canvasListHeight) => set({ canvasListHeight }),
      setCanvasSize: (canvasSize) => set({ canvasSize }),
      setSize: (id, size) => set((state) => ({ sizes: { ...state.sizes, [id]: size } })),
      setFonts: (fonts) => set({ fonts }),
      setHandFontReady: () => set({ handFontReady: true }),
      setEditorOpen: (editorOpen) => set({ editorOpen }),
      setEditorHeight: (editorHeight) => set({ editorHeight }),
    }),
    {
      name: "mermaid-canvas",
      version: 7,
      migrate: (persisted, version) => {
        let state = persisted as Record<string, unknown>
        if (version < 2) {
          // v1 had one control panel; it became the layers + inspector pair.
          const { panelOpen, ...rest } = state
          state = { ...rest, panels: { layers: panelOpen !== false, inspector: panelOpen !== false } }
        }
        if (version < 3) {
          // v2's canvas started right of the docked layers panel; now it spans
          // the window under it. Shift the camera so nothing moves on screen.
          const panels = state.panels as State["panels"]
          const viewport = state.viewport as Viewport
          if (panels.layers) state = { ...state, viewport: { ...viewport, x: viewport.x + PANEL_WIDTH.layers } }
        }
        if (version < 4) {
          // v3 kept a single selection; v4 keeps a list.
          const selectedId = state.selectedId as string | null
          state = { ...state, selectedIds: selectedId ? [selectedId] : [] }
        }
        if (version < 5) {
          // v5 adds the hand-drawn look; everything saved before was classic.
          state = { ...state, settings: { ...(state.settings as Settings), look: "classic" } }
        }
        if (version < 6) {
          // v6 makes the panels resizable; they start at the old fixed widths.
          state = { ...state, panelWidths: PANEL_WIDTH }
        }
        if (version < 7) {
          // v7 adds canvases; everything saved before goes onto the default one.
          state = {
            ...state,
            canvases: [{ ...DEFAULT_CANVAS, viewport: state.viewport as Viewport }],
            currentCanvasId: DEFAULT_CANVAS.id,
            diagrams: (state.diagrams as Diagram[]).map((d) => ({ ...d, canvasId: DEFAULT_CANVAS.id })),
            canvasListOpen: true,
            canvasListHeight: null,
          }
        }
        return state
      },
      partialize: ({
        canvases,
        currentCanvasId,
        diagrams,
        selectedIds,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
        panelWidths,
        canvasListOpen,
        canvasListHeight,
        editorHeight,
      }) => ({
        // Saved with the current canvas's camera, so each record is complete.
        canvases: canvases.map((c) => (c.id === currentCanvasId ? { ...c, viewport } : c)),
        currentCanvasId,
        diagrams,
        selectedIds,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
        panelWidths,
        canvasListOpen,
        canvasListHeight,
        editorHeight,
      }),
    }
  )
)
