"use client"

import { Copy, Download, LocateFixed, SquareArrowRight, Trash2 } from "lucide-react"

import { CodePreview } from "@/components/editor/code-preview"
import { MoveToCanvasMenu } from "@/components/panel/move-to-canvas"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDiagramRender, useDiagramVars, useRenderSettings } from "@/hooks/use-diagram"
import { copyCode, copySvg, deleteDiagrams, downloadPng, downloadSvg, duplicateDiagram } from "@/lib/actions"
import { useCanvasStore, type Diagram } from "@/lib/store"
import { focusDiagram } from "@/lib/viewport"

function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon" aria-label={label} onClick={onClick} className={className} />}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function DiagramEditor({ diagram }: { diagram: Diagram }) {
  const updateDiagram = useCanvasStore((s) => s.updateDiagram)
  const output = useDiagramRender(diagram.code)
  const settings = useRenderSettings()
  const vars = useDiagramVars()
  const hasError = output ? !output.ok : false

  const exportInput = settings && { title: diagram.title, code: diagram.code, settings, vars }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diagram-title">名称</Label>
        <Input
          id="diagram-title"
          value={diagram.title}
          onChange={(event) => updateDiagram(diagram.id, { title: event.target.value })}
          autoComplete="off"
        />
      </div>

      {/* The code itself is edited in the dock under the canvas. */}
      <CodePreview diagram={diagram} />

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />} disabled={!exportInput || hasError}>
            <Download data-icon="inline-start" />
            导出
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onClick={() => exportInput && downloadSvg(exportInput)}>下载 SVG</DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportInput && downloadPng(exportInput)}>
              下载 PNG（2×）
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => exportInput && copySvg(exportInput)}>复制 SVG 代码</DropdownMenuItem>
            <DropdownMenuItem onClick={() => copyCode(diagram.code)}>复制 Mermaid 代码</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconAction label="在画布中定位" onClick={() => focusDiagram(diagram.id)}>
          <LocateFixed />
        </IconAction>
        <IconAction label="创建副本" onClick={() => duplicateDiagram(diagram.id)}>
          <Copy />
        </IconAction>
        <MoveToCanvasMenu
          ids={[diagram.id]}
          trigger={
            <Tooltip>
              {/* One button is both the tooltip trigger and the menu trigger. */}
              <TooltipTrigger
                render={<DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="移到画布" />} />}
              >
                <SquareArrowRight />
              </TooltipTrigger>
              <TooltipContent>移到画布</TooltipContent>
            </Tooltip>
          }
        />
        <div className="flex-1" />
        <IconAction
          label="删除图表"
          onClick={() => deleteDiagrams([diagram.id])}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </IconAction>
      </div>
    </div>
  )
}
