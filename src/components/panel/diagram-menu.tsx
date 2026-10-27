"use client"

import { MoveToCanvasSubmenu } from "@/components/panel/move-to-canvas"
import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { deleteDiagrams } from "@/lib/actions"
import { useCanvasStore } from "@/lib/store"

/** The context menu for a diagram, shared by its layer row and its card on the canvas. */
export function DiagramMenu({ id }: { id: string }) {
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const duplicateDiagram = useCanvasStore((s) => s.duplicateDiagram)
  // Right-clicking a diagram inside the selection acts on the whole selection.
  const ids = selectedIds.includes(id) ? selectedIds : [id]
  return (
    <ContextMenuContent className="w-40">
      <MoveToCanvasSubmenu ids={ids} />
      {ids.length === 1 && <ContextMenuItem onClick={() => duplicateDiagram(id)}>创建副本</ContextMenuItem>}
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => deleteDiagrams(ids)}>
        {ids.length === 1 ? "删除" : `删除 ${ids.length} 张图表`}
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
