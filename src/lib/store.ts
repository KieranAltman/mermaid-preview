import { create } from "zustand"
import { persist } from "zustand/middleware"

import { defaultTemplate, templates } from "@/lib/templates"

export const GRID_SIZE = 24
export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 4
// Matches the layers panel's w-64.
export const LAYERS_PANEL_WIDTH = 256

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
  selectedId: string | null
  topZ: number
  viewport: Viewport
  settings: Settings
  panels: Record<PanelSide, boolean>
  // Runtime only, not persisted.
  canvasSize: Size
  sizes: Record<string, Size>
  fonts: { sans: string; mono: string } | null
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
  removeDiagram: (id: string) => Diagram | undefined
  restoreDiagram: (diagram: Diagram) => void
  duplicateDiagram: (id: string, options?: { animate?: boolean }) => string | undefined
  select: (id: string | null) => void
  setViewport: (viewport: Viewport) => void
  zoomAt: (zoom: number, point: { x: number; y: number }) => void
  updateSettings: (patch: Partial<Settings>) => void
  setPanel: (side: PanelSide, open: boolean) => void
  setCanvasSize: (size: Size) => void
  setSize: (id: string, size: Size) => void
  setFonts: (fonts: { sans: string; mono: string }) => void
}

const clampZoom = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))

export const snap = (value: number) => Math.round(value / GRID_SIZE) * GRID_SIZE

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
  A[双击空白处] --> B[新建图表]
  B --> C[在左侧编辑代码]
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
      selectedId: "welcome",
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
      canvasSize: { width: 0, height: 0 },
      sizes: {},
      fonts: null,
      enteringId: null,

      addDiagram: (input = {}) => {
        const { diagrams, viewport, canvasSize, topZ, settings } = get()
        const id = crypto.randomUUID()
        // Default to the visible center of the canvas, in world coordinates.
        let at = input.at ?? {
          x: (canvasSize.width / 2 - viewport.x) / viewport.zoom - 160,
          y: (canvasSize.height / 2 - viewport.y) / viewport.zoom - 80,
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
          selectedId: id,
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

      removeDiagram: (id) => {
        const diagram = get().diagrams.find((d) => d.id === id)
        set((state) => ({
          diagrams: state.diagrams.filter((d) => d.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }))
        return diagram
      },

      restoreDiagram: (diagram) =>
        set((state) => ({
          diagrams: [...state.diagrams, diagram],
          selectedId: diagram.id,
          enteringId: diagram.id,
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
          if (id === null) return { selectedId: null }
          const topZ = state.topZ + 1
          return {
            selectedId: id,
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
          // On phones the panels overlay the canvas, so only one fits at a time.
          if (window.matchMedia("(max-width: 767px)").matches) {
            if (open) panels[side === "layers" ? "inspector" : "layers"] = false
            return { panels }
          }
          // On wider screens the layers panel pushes the canvas, so shift the
          // viewport by its width to keep diagrams still on screen.
          if (side === "inspector") return { panels }
          const shift = open ? -LAYERS_PANEL_WIDTH : LAYERS_PANEL_WIDTH
          return { panels, viewport: { ...state.viewport, x: state.viewport.x + shift } }
        }),
      setCanvasSize: (canvasSize) => set({ canvasSize }),
      setSize: (id, size) => set((state) => ({ sizes: { ...state.sizes, [id]: size } })),
      setFonts: (fonts) => set({ fonts }),
    }),
    {
      name: "mermaid-canvas",
      version: 2,
      migrate: (persisted, version) => {
        const state = persisted as Record<string, unknown>
        if (version < 2) {
          // v1 had one control panel; it became the layers + inspector pair.
          const { panelOpen, ...rest } = state
          return { ...rest, panels: { layers: panelOpen !== false, inspector: panelOpen !== false } }
        }
        return state
      },
      partialize: ({ diagrams, selectedId, topZ, viewport, settings, panels }) => ({
        diagrams,
        selectedId,
        topZ,
        viewport,
        settings,
        panels,
      }),
    }
  )
)
