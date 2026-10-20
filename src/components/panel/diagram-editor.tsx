"use client"

import { CircleAlert, Copy, Download, LocateFixed, Trash2 } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDiagramRender, useDiagramVars, useRenderSettings } from "@/hooks/use-diagram"
import { copyCode, copySvg, deleteDiagram, downloadPng, downloadSvg } from "@/lib/actions"
import { useCanvasStore, type Diagram } from "@/lib/store"
import { typeLabel } from "@/lib/templates"
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
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={label} onClick={onClick} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function RenderStatus({ code }: { code: string }) {
  const output = useDiagramRender(code)
  if (!output) return null

  if (output.ok) {
    const { type, width, height } = output.result
    return (
      <p className="text-xs text-muted-foreground tabular-nums">
        {typeLabel(type)} · {Math.round(width)} × {Math.round(height)} px
      </p>
    )
  }

  const { line, column, message, snippet } = output.error
  // Pele's message repeats the position and snippet; keep only the reason.
  const reason = message.split("\n").filter(Boolean).at(-1)
  return (
    <div
      id="diagram-code-error"
      className="flex flex-col gap-1.5 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-xs"
    >
      <p className="flex items-center gap-1.5 font-medium text-destructive">
        <CircleAlert className="size-3.5 shrink-0" aria-hidden />
        {line > 0 ? `第 ${line} 行，第 ${column} 列` : "无法渲染"}
      </p>
      <p className="text-foreground/90">{reason}</p>
      {/* An error on a blank line yields a snippet that's only a caret. */}
      {snippet.split("\n")[0].trim() && (
        <pre className="overflow-x-auto rounded bg-background/70 px-2 py-1.5 font-mono text-[11px] leading-4 text-muted-foreground">
          {snippet}
        </pre>
      )}
    </div>
  )
}

export function DiagramEditor({ diagram }: { diagram: Diagram }) {
  const updateDiagram = useCanvasStore((s) => s.updateDiagram)
  const duplicateDiagram = useCanvasStore((s) => s.duplicateDiagram)
  const output = useDiagramRender(diagram.code)
  const settings = useRenderSettings()
  const vars = useDiagramVars()
  const hasError = output ? !output.ok : false

  const exportInput = settings && { title: diagram.title, code: diagram.code, settings, vars }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.currentTarget.blur()
    } else if (event.key === "Tab" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
      event.preventDefault()
      // execCommand keeps the native undo stack, unlike setting the value.
      document.execCommand("insertText", false, "  ")
    }
  }

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between">
          <Label htmlFor="diagram-code">Mermaid 代码</Label>
          <span className="text-xs text-muted-foreground">Tab 缩进 · Esc 退出</span>
        </div>
        <Textarea
          id="diagram-code"
          value={diagram.code}
          onChange={(event) => updateDiagram(diagram.id, { code: event.target.value })}
          onKeyDown={onKeyDown}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? "diagram-code-error" : undefined}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          rows={14}
          className="min-h-48 resize-y font-mono text-base leading-6 [tab-size:2] md:text-[13px] md:leading-5"
        />
        <div aria-live="polite">
          <RenderStatus code={diagram.code} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={!exportInput || hasError}>
              <Download data-icon="inline-start" />
              导出
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            <DropdownMenuItem onSelect={() => exportInput && downloadSvg(exportInput)}>下载 SVG</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => exportInput && downloadPng(exportInput)}>
              下载 PNG（2×）
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => exportInput && copySvg(exportInput)}>复制 SVG 代码</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => copyCode(diagram.code)}>复制 Mermaid 代码</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <IconAction label="在画布中定位" onClick={() => focusDiagram(diagram.id)}>
          <LocateFixed />
        </IconAction>
        <IconAction label="创建副本" onClick={() => duplicateDiagram(diagram.id)}>
          <Copy />
        </IconAction>
        <div className="flex-1" />
        <IconAction
          label="删除图表"
          onClick={() => deleteDiagram(diagram.id)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 />
        </IconAction>
      </div>
    </div>
  )
}
