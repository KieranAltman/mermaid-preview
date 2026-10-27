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
  title: string
  code: string
  x: number
  y: number
  z: number
}

export type Viewport = { x: number; y: number; zoom: number }

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
  zoomAt: (zoom: number, point: { x: number; y: number }) => void
  updateSettings: (patch: Partial<Settings>) => void
  setPanel: (side: PanelSide, open: boolean) => void
  setPanelWidth: (side: PanelSide, width: number) => void
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

function nextTitle(diagrams: Diagram[]) {
  let n = diagrams.length + 1
  while (diagrams.some((d) => d.title === `图表 ${n}`)) n++
  return `图表 ${n}`
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

const seed: Diagram[] = [
  {
    id: "welcome",
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
      panelWidths: PANEL_WIDTH,
      editorHeight: 300,
      canvasSize: { width: 0, height: 0 },
      sizes: {},
      fonts: null,
      handFontReady: false,
      editorOpen: false,
      enteringId: null,

      addDiagram: (input = {}) => {
        const { diagrams, viewport, topZ, settings } = get()
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
          title: input.title ?? nextTitle(diagrams),
          code: input.code ?? defaultTemplate.code,
          ...spot,
          z: topZ + 1,
        }
        set({
          diagrams: [...diagrams, diagram],
          ...selection([id]),
          topZ: topZ + 1,
          enteringId: input.animate === false ? null : id,
        })
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
        set((state) => ({
          diagrams: [...state.diagrams, ...restored],
          ...selection(restored.map((d) => d.id)),
          // A single undo plays the card's entrance; a batch just reappears.
          enteringId: restored.length === 1 ? restored[0].id : null,
        })),

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
      setCanvasSize: (canvasSize) => set({ canvasSize }),
      setSize: (id, size) => set((state) => ({ sizes: { ...state.sizes, [id]: size } })),
      setFonts: (fonts) => set({ fonts }),
      setHandFontReady: () => set({ handFontReady: true }),
      setEditorOpen: (editorOpen) => set({ editorOpen }),
      setEditorHeight: (editorHeight) => set({ editorHeight }),
    }),
    {
      name: "mermaid-canvas",
      version: 6,
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
        return state
      },
      partialize: ({
        diagrams,
        selectedIds,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
        panelWidths,
        editorHeight,
      }) => ({
        diagrams,
        selectedIds,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
        panelWidths,
        editorHeight,
      }),
    }
  )
)
