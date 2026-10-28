"use client"

import { useState } from "react"
import { Workflow } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import { DiagramTypeIcon } from "@/components/icons/diagram-icons"
import { DiagramMenu } from "@/components/panel/diagram-menu"
import { consumeDragClick, startLayerDrag, useLayerDrag } from "@/components/panel/layer-drag"
import { NewDiagramMenu } from "@/components/panel/new-diagram-menu"
import { useSharedHover } from "@/components/panel/shared-hover"
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
  // While the code has an error, the row keeps the type it last drew as.
  const [type, setType] = useState<string | null>(null)
  if (output?.ok && output.result.type !== type) setType(output.result.type)
  // Left behind, faded, while the row is carried to another canvas.
  const lifted = useLayerDrag((drag) => !!drag?.ids.includes(id))

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <li
            data-hover-row
            className={cn(
              "transition-opacity duration-150 motion-reduce:transition-none",
              lifted && "opacity-40"
            )}
          />
        }
      >
        <button
          type="button"
          aria-current={selected || undefined}
          onPointerDown={(event) => startLayerDrag(event, id)}
          onClick={(event) => {
            if (consumeDragClick()) return
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
              : "text-sidebar-item hover:text-sidebar-foreground"
          )}
        >
          {/* The type as an icon; the slot is held before the first render so the title doesn't shift.
              Code that has never drawn gets the generic icon. */}
          {type || (output && !output.ok) ? (
            <DiagramTypeIcon
              type={type}
              aria-hidden
              className={cn("size-3.5 shrink-0", selected ? "text-sidebar-accent-foreground" : "text-muted-foreground")}
            />
          ) : (
            <span aria-hidden className="size-3.5 shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate text-xs">
            {diagram.title}
            {type && <span className="sr-only">，{typeLabel(type)}</span>}
          </span>
          {output && !output.ok && (
            <span className="flex shrink-0 items-center gap-1 text-xs font-normal text-destructive">
              <span className="size-1.5 rounded-full bg-destructive" aria-hidden />
              有错误
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
  const hover = useSharedHover<HTMLUListElement>()

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
    <ul {...hover.listProps} className="relative isolate flex flex-col gap-px">
      {hover.highlight}
      {ids.map((id) => (
        <DiagramRow key={id} id={id} />
      ))}
    </ul>
  )
}
