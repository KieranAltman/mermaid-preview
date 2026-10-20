"use client"

import { PanelLeftOpen, PanelRightOpen } from "lucide-react"

import { NewDiagramMenu } from "@/components/panel/new-diagram-menu"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { modKey } from "@/lib/platform"
import { useCanvasStore } from "@/lib/store"

export function CanvasEmptyState() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
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
  const panels = useCanvasStore((s) => s.panels)
  const setPanel = useCanvasStore((s) => s.setPanel)

  return (
    <>
      {!panels.layers && (
        <Button
          data-canvas-ui
          variant="ghost"
          size="icon"
          className="absolute top-3 left-3 bg-background shadow-(--frame-shadow)"
          aria-label="展开图层面板"
          onClick={() => setPanel("layers", true)}
        >
          <PanelLeftOpen />
        </Button>
      )}
      {!panels.inspector && (
        <Button
          data-canvas-ui
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 bg-background shadow-(--frame-shadow)"
          aria-label="展开属性面板"
          onClick={() => setPanel("inspector", true)}
        >
          <PanelRightOpen />
        </Button>
      )}
      <p className="pointer-events-none absolute bottom-5 left-4 hidden items-center gap-3 text-xs text-muted-foreground lg:flex">
        <span>双击空白处新建</span>
        <span>拖拽空白处平移</span>
        <span className="flex items-center gap-1">
          <Kbd>{modKey}</Kbd> + 滚轮缩放
        </span>
      </p>
    </>
  )
}
