"use client"

import { CircleAlert } from "lucide-react"

import { useDiagramRender } from "@/hooks/use-diagram"
import { errorReason } from "@/lib/pele"
import { typeLabel } from "@/lib/templates"
import { cn } from "@/lib/utils"

/** One line: type and length when the code draws, position and reason when it doesn't. */
export function RenderStatus({ code, className }: { code: string; className?: string }) {
  const output = useDiagramRender(code)
  if (!output) return null

  if (output.ok) {
    return (
      <p className={cn("truncate text-xs text-muted-foreground tabular-nums", className)}>
        {typeLabel(output.result.type)} · {code.split("\n").length} 行
      </p>
    )
  }

  const { line, column } = output.error
  const reason = errorReason(output.error)
  return (
    <p className={cn("flex min-w-0 items-center gap-1.5 text-xs text-destructive", className)} title={reason}>
      <CircleAlert className="size-3.5 shrink-0" aria-hidden />
      <span className="shrink-0 font-medium">{line > 0 ? `第 ${line} 行，第 ${column} 列` : "无法渲染"}</span>
      <span className="truncate text-foreground/80">{reason}</span>
    </p>
  )
}
