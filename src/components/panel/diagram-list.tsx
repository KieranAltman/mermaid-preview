"use client"

import { Workflow } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { DiagramMenu } from "@/components/panel/diagram-menu"
import { NewDiagramMenu } from "@/components/panel/new-diagram-menu"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useDiagramRender } from "@/hooks/use-diagram"
import { currentDiagrams, useCanvasStore } from "@/lib/store"
import { typeLabel } from "@/lib/templates"
import { focusDiagram } from "@/lib/viewport"
import { cn } from "@/lib/utils"

function DiagramRow({ id }: { id: string }) {
  const diagram = useCanvasStore((s) => s.diagrams.find((d) => d.id === id))!
  const selected = useCanvasStore((s) => s.selectedIds.includes(id))
  const select = useCanvasStore((s) => s.select)
  const toggleSelection = useCanvasStore((s) => s.toggleSelection)
  const output = useDiagramRender(diagram.code)

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<li />}>
        <button
          type="button"
          aria-current={selected || undefined}
          onClick={(event) => {
            // Shift adds or removes this row, as on the canvas; the camera stays put.
            if (event.shiftKey) {
              toggleSelection(id)
              return
            }
            select(id)
            // detail is 0 when Enter/Space activated the button: jump, don't glide.
            focusDiagram(id, { animate: event.detail !== 0 })
          }}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            selected
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          )}
        >
          <span className="min-w-0 flex-1 truncate text-xs">{diagram.title}</span>
          {output && !output.ok ? (
            <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
              有错误
            </span>
          ) : (
            <span className="shrink-0 text-xs font-normal text-muted-foreground">
              {output?.ok && typeLabel(output.result.type)}
            </span>
          )}
        </button>
      </ContextMenuTrigger>
      <DiagramMenu id={id} />
    </ContextMenu>
  )
}

export function DiagramList() {
  const ids = useCanvasStore(useShallow((s) => currentDiagrams(s).map((d) => d.id)))

  if (ids.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 pt-8 pb-4 text-center">
        <div
          aria-hidden
          className="flex size-10 items-center justify-center rounded-lg bg-field text-muted-foreground ring-1 ring-border"
        >
          <Workflow className="size-5" />
        </div>
        <p className="text-xs text-balance text-muted-foreground">这张画布还没有图表，从一个模板开始。</p>
        {/* Outline, not filled: the canvas beside it already shows the primary button. */}
        <NewDiagramMenu size="sm" variant="outline" />
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-px">
      {ids.map((id) => (
        <DiagramRow key={id} id={id} />
      ))}
    </ul>
  )
}
