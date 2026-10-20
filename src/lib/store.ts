import { create } from "zustand"
import { persist } from "zustand/middleware"

import { defaultTemplate, templates } from "@/lib/templates"

export const GRID_SIZE = 24
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4
// Desktop panel widths; keep in sync with --layers-w / --inspector-w in globals.css.
export const PANEL_WIDTH = { layers: 256, inspector: 320 }
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
  editorHeight: number
  // Runtime only, not persisted.
  canvasSize: Size
  sizes: Record<string, Size>
  fonts: { sans: string; mono: string } | null
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
  setEditorOpen: (open: boolean) => void
  setEditorHeight: (height: number) => void
  setCanvasSize: (size: Size) => void
  setSize: (id: string, size: Size) => void
  setFonts: (fonts: { sans: string; mono: string }) => void
}

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

/**
 * The part of the canvas not covered by docked panels, in canvas coordinates.
 * The canvas always spans the full window and the panels float over it.
 */
export function visibleArea({
  canvasSize,
  panels,
  editorOpen,
  editorHeight,
}: Pick<State, "canvasSize" | "panels" | "editorOpen" | "editorHeight">) {
  const docked = window.matchMedia(DESKTOP_QUERY).matches
  const left = docked && panels.layers ? PANEL_WIDTH.layers : 0
  const right = docked && panels.inspector ? PANEL_WIDTH.inspector : 0
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
      },
      panels: { layers: true, inspector: true },
      editorHeight: 300,
      canvasSize: { width: 0, height: 0 },
      sizes: {},
      fonts: null,
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
      setCanvasSize: (canvasSize) => set({ canvasSize }),
      setSize: (id, size) => set((state) => ({ sizes: { ...state.sizes, [id]: size } })),
      setFonts: (fonts) => set({ fonts }),
      setEditorOpen: (editorOpen) => set({ editorOpen }),
      setEditorHeight: (editorHeight) => set({ editorHeight }),
    }),
    {
      name: "mermaid-canvas",
      version: 4,
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
        return state
      },
      partialize: ({ diagrams, selectedIds, selectedId, topZ, viewport, settings, panels, editorHeight }) => ({
        diagrams,
        selectedIds,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
        editorHeight,
      }),
    }
  )
)
