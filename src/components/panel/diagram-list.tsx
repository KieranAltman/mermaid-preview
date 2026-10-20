"use client"

import { useShallow } from "zustand/react/shallow"

import { useDiagramRender } from "@/hooks/use-diagram"
import { useCanvasStore } from "@/lib/store"
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
    <li>
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
        <span className="min-w-0 flex-1 truncate">{diagram.title}</span>
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
    </li>
  )
}

export function DiagramList() {
  const ids = useCanvasStore(useShallow((s) => s.diagrams.map((d) => d.id)))

  if (ids.length === 0) {
    return (
      <p className="px-1 py-1 text-sm text-muted-foreground">
        还没有图表，用上方的「新建图表」开始。
      </p>
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
