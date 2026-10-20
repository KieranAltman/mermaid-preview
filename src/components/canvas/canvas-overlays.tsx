"use client"

import { NewDiagramMenu } from "@/components/panel/new-diagram-menu"
import { followPanelMotion } from "@/components/panel/panel-chrome"
import { Kbd } from "@/components/ui/kbd"
import { modKey } from "@/lib/platform"
import { useCanvasStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function CanvasEmptyState() {
  return (
    // Centered in the area between docked panels, moving with them.
    <div className="pointer-events-none absolute inset-0 flex translate-x-[calc((var(--inset-left)-var(--inset-right))/2)] items-center justify-center p-6 transition-[translate] duration-300 ease-drawer group-data-[ready=false]/studio:transition-none">
      <div data-canvas-ui className="pointer-events-auto flex max-w-xs flex-col items-center gap-3 text-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">画布还是空的</h2>
          <p className="text-sm text-balance text-muted-foreground">
            双击任意空白处创建流程图，或从模板开始。
          </p>
        </div>
        <NewDiagramMenu />
      </div>
    </div>
  )
}

export function CanvasHints() {
  const layersOpen = useCanvasStore((s) => s.panels.layers)

  return (
    <p
      data-state={layersOpen ? "open" : "closed"}
      className={cn(
        "pointer-events-none absolute bottom-5 left-4 hidden translate-x-(--inset-left) -translate-y-(--inset-bottom) items-center gap-3 text-xs text-muted-foreground lg:flex",
        followPanelMotion
      )}
    >
      <span>双击空白处新建</span>
      <span>拖拽空白处平移</span>
      <span className="flex items-center gap-1">
        <Kbd>{modKey}</Kbd> + 滚轮缩放
      </span>
    </p>
  )
}
