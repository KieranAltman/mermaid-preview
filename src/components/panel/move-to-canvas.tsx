"use client"

import type { ReactElement } from "react"
import { Plus } from "lucide-react"

import {
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { moveToCanvas, moveToNewCanvas } from "@/lib/canvases"
import { useCanvasStore } from "@/lib/store"

/** Every canvas but the current one, in list order. */
function useOtherCanvases() {
  const canvases = useCanvasStore((s) => s.canvases)
  const currentId = useCanvasStore((s) => s.currentCanvasId)
  return canvases.filter((c) => c.id !== currentId)
}

/** "移到画布" as its own menu, opened by `trigger`, a DropdownMenuTrigger. */
export function MoveToCanvasMenu({ ids, trigger }: { ids: string[]; trigger: ReactElement }) {
  const others = useOtherCanvases()
  return (
    <DropdownMenu>
      {trigger}
      <DropdownMenuContent align="start" className="w-44">
        {/* Base UI's group label only works inside a group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>移到画布</DropdownMenuLabel>
          {others.map((canvas) => (
            <DropdownMenuItem key={canvas.id} onClick={() => moveToCanvas(ids, canvas.id)}>
              <span className="min-w-0 truncate">{canvas.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {others.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={() => moveToNewCanvas(ids)}>
          <Plus />
          新建画布
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** "移到画布 ▸" inside a context menu. */
export function MoveToCanvasSubmenu({ ids }: { ids: string[] }) {
  const others = useOtherCanvases()
  return (
    <ContextMenuSub>
      <ContextMenuSubTrigger>移到画布</ContextMenuSubTrigger>
      <ContextMenuSubContent className="w-44">
        {others.map((canvas) => (
          <ContextMenuItem key={canvas.id} onClick={() => moveToCanvas(ids, canvas.id)}>
            <span className="min-w-0 truncate">{canvas.name}</span>
          </ContextMenuItem>
        ))}
        {others.length > 0 && <ContextMenuSeparator />}
        <ContextMenuItem onClick={() => moveToNewCanvas(ids)}>
          <Plus />
          新建画布
        </ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  )
}
