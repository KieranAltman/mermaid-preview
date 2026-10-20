"use client"

import type { ReactNode } from "react"
import { Minus, Plus, Scan } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { modKey } from "@/lib/platform"
import { useCanvasStore } from "@/lib/store"
import { fitAll, resetZoom, zoomBy } from "@/lib/viewport"

function Hint({ label, keys, children }: { label: string; keys: string[]; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="flex items-center gap-2">
        {label}
        <KbdGroup>
          {keys.map((key) => (
            <Kbd key={key}>{key}</Kbd>
          ))}
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}

export function ZoomControls() {
  const zoom = useCanvasStore((s) => s.viewport.zoom)

  return (
    <div
      data-canvas-ui
      className="absolute right-4 bottom-4 flex items-center gap-0.5 rounded-lg bg-background p-0.5 shadow-(--frame-shadow)"
    >
      <Hint label="缩小" keys={[modKey, "−"]}>
        <Button variant="ghost" size="icon-sm" aria-label="缩小" onClick={() => zoomBy(0.8)}>
          <Minus />
        </Button>
      </Hint>
      <Hint label="缩放到 100%" keys={[modKey, "0"]}>
        <Button
          variant="ghost"
          size="sm"
          className="w-14 px-0 tabular-nums"
          aria-label={`当前缩放 ${Math.round(zoom * 100)}%，点击重置为 100%`}
          onClick={() => resetZoom()}
        >
          {Math.round(zoom * 100)}%
        </Button>
      </Hint>
      <Hint label="放大" keys={[modKey, "+"]}>
        <Button variant="ghost" size="icon-sm" aria-label="放大" onClick={() => zoomBy(1.25)}>
          <Plus />
        </Button>
      </Hint>
      <div className="mx-0.5 h-4 w-px bg-border" />
      <Hint label="显示全部图表" keys={["⇧", "1"]}>
        <Button variant="ghost" size="icon-sm" aria-label="显示全部图表" onClick={() => fitAll()}>
          <Scan />
        </Button>
      </Hint>
    </div>
  )
}
