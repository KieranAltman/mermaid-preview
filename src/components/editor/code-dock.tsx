"use client"

import { ChevronDown } from "lucide-react"

import { CodeField } from "@/components/editor/code-field"
import { RenderStatus } from "@/components/editor/render-status"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDiagramRender } from "@/hooks/use-diagram"
import { closeEditor } from "@/lib/editor"
import { useCanvasStore } from "@/lib/store"

const MIN_HEIGHT = 160
const STEP = 24
const maxHeight = () => Math.round(window.innerHeight * 0.7)
const clampHeight = (height: number) => Math.min(maxHeight(), Math.max(MIN_HEIGHT, height))

/** The code editor, docked to the bottom of the canvas between the side panels. */
export function CodeDock() {
  const open = useCanvasStore((s) => s.editorOpen)
  const height = useCanvasStore((s) => s.editorHeight)
  const setHeight = useCanvasStore((s) => s.setEditorHeight)
  const diagram = useCanvasStore((s) => s.diagrams.find((d) => d.id === s.selectedId))
  const updateDiagram = useCanvasStore((s) => s.updateDiagram)
  const output = useDiagramRender(diagram?.code ?? "")

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const handle = event.currentTarget
    const startY = event.clientY
    const startHeight = height
    handle.setPointerCapture(event.pointerId)
    // Overlays that follow the editor track the handle directly while dragging.
    const studio = handle.closest<HTMLElement>(".studio")
    studio?.setAttribute("data-resizing", "")
    const move = (e: PointerEvent) => setHeight(clampHeight(startHeight - (e.clientY - startY)))
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
    <section
      aria-label="Mermaid 代码编辑器"
      data-state={open ? "open" : "closed"}
      inert={!open}
      // left/right follow the docked panels. A lone absolutely positioned
      // surface with no layout dependents, so animating them stays cheap.
      style={{ height, left: "var(--inset-left)", right: "var(--inset-right)" }}
      // Same surface as the side panels: square corners, sidebar fill, one
      // hairline against the canvas and no lift; the three read as one frame.
      className="absolute bottom-0 z-10 flex flex-col border-t bg-sidebar text-sidebar-foreground transition-[translate,left,right] duration-200 ease-drawer data-closed:translate-y-full data-open:duration-300 group-data-[ready=false]/studio:transition-none"
    >
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整编辑器高度"
        aria-valuemin={MIN_HEIGHT}
        aria-valuemax={maxHeight()}
        aria-valuenow={height}
        tabIndex={0}
        onPointerDown={startResize}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
          event.preventDefault()
          setHeight(clampHeight(height + (event.key === "ArrowUp" ? STEP : -STEP)))
        }}
        className="group/handle absolute inset-x-0 -top-2 z-10 flex h-4 cursor-ns-resize touch-none items-center justify-center outline-none"
      >
        <span className="h-1 w-9 rounded-full bg-border transition-colors duration-150 group-hover/handle:bg-muted-foreground/50 group-focus-visible/handle:bg-ring" />
      </div>

      {/* Matches the panel headers: 48px, a bottom rule, the icon 16px from the edge. */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b pr-2 pl-4">
        <h2 className="shrink-0 text-sm font-semibold">Mermaid 代码</h2>
        {diagram && <span className="min-w-0 truncate text-sm text-muted-foreground">{diagram.title}</span>}
        <div className="flex min-w-0 flex-1 justify-end">{diagram && <RenderStatus code={diagram.code} />}</div>
        <Tooltip>
          <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="收起代码编辑器" onClick={closeEditor} />}>
            <ChevronDown />
          </TooltipTrigger>
          <TooltipContent>收起 · Esc</TooltipContent>
        </Tooltip>
      </header>

      {diagram ? (
        // Edge to edge under the header: the field fill marks the code area,
        // and the caret, not a ring, shows focus, as in a code editor.
        <CodeField
          value={diagram.code}
          onChange={(code) => updateDiagram(diagram.id, { code })}
          invalid={output ? !output.ok : false}
          errorLine={output && !output.ok && output.error.line > 0 ? output.error.line : null}
          onEscape={closeEditor}
          className="flex-1"
        />
      ) : (
        <p className="m-auto p-4 text-sm text-muted-foreground">在画布上选择一张图表，它的代码会显示在这里。</p>
      )}
    </section>
  )
}
