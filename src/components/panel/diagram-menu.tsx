"use client"

import { Copy, Trash2 } from "lucide-react"

import { MoveToCanvasSubmenu } from "@/components/panel/move-to-canvas"
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { deleteDiagrams } from "@/lib/actions"
import { modKey } from "@/lib/platform"
import { useCanvasStore } from "@/lib/store"

/** The context menu for a diagram, shared by its layer row and its card on the canvas. */
export function DiagramMenu({ id }: { id: string }) {
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const duplicateDiagram = useCanvasStore((s) => s.duplicateDiagram)
  // Right-clicking a diagram inside the selection acts on the whole selection.
  const ids = selectedIds.includes(id) ? selectedIds : [id]
  return (
    <ContextMenuContent className="w-44">
      <MoveToCanvasSubmenu ids={ids} />
      {ids.length === 1 && (
        <ContextMenuItem onClick={() => duplicateDiagram(id)}>
          <Copy />
          创建副本
          <ContextMenuShortcut>{modKey}D</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => deleteDiagrams(ids)}>
        <Trash2 />
        {ids.length === 1 ? "删除" : `删除 ${ids.length} 张图表`}
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
