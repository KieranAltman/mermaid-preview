"use client"

import { memo, useEffect, useRef, useState } from "react"
import { CircleAlert } from "lucide-react"
import type { RenderResult } from "pele"

import { useDiagramRender } from "@/hooks/use-diagram"
import { useCanvasStore } from "@/lib/store"
import { typeLabel } from "@/lib/templates"
import { cn } from "@/lib/utils"

export const DiagramCard = memo(function DiagramCard({ id }: { id: string }) {
  const diagram = useCanvasStore((s) => s.diagrams.find((d) => d.id === id))
  const selected = useCanvasStore((s) => s.selectedId === id)
  const entering = useCanvasStore((s) => s.enteringId === id)
  const setSize = useCanvasStore((s) => s.setSize)
  const output = useDiagramRender(diagram?.code ?? "")
  const frameRef = useRef<HTMLDivElement>(null)

  // While the source has an error, keep showing the last diagram that drew.
  const [lastGood, setLastGood] = useState<RenderResult | null>(null)
  if (output?.ok && output.result !== lastGood) setLastGood(output.result)
  const shown = output?.ok ? output.result : lastGood
  const error = output && !output.ok ? output.error : null

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    // offsetWidth/Height are untransformed, so they're already world units.
    const observer = new ResizeObserver(() =>
      setSize(id, { width: frame.offsetWidth, height: frame.offsetHeight })
    )
    observer.observe(frame)
    return () => observer.disconnect()
  }, [id, setSize])

  if (!diagram) return null

  return (
    <div
      data-diagram-id={id}
      className={cn("absolute top-0 left-0", entering && "animate-diagram-enter")}
      style={{ transform: `translate(${diagram.x}px, ${diagram.y}px)`, zIndex: diagram.z }}
    >
      {/* Counter-scaled so the label stays readable at every zoom level. */}
      <div
        className={cn(
          "absolute bottom-full left-0 flex max-w-[480px] origin-bottom-left items-center gap-1.5 pb-1.5 text-xs whitespace-nowrap",
          selected ? "text-selection" : "text-muted-foreground"
        )}
        style={{ transform: "scale(calc(1 / var(--zoom)))" }}
      >
        <span className="truncate font-medium">{diagram.title}</span>
        {shown && <span className="opacity-70">{typeLabel(shown.type)}</span>}
      </div>

      <div
        ref={frameRef}
        className={cn(
          "relative cursor-default rounded-lg bg-(--pele-bg) shadow-(--frame-shadow) outline-offset-0 outline-selection",
          // Selecting happens constantly, so it lands instantly; hover and
          // deselect fade so the outline doesn't flicker under the pointer.
          selected
            ? "outline-solid"
            : "outline-transparent transition-[outline-color] duration-150 hover:outline-solid hover:outline-selection/40"
        )}
        style={{ outlineWidth: "calc(2px / var(--zoom))" }}
      >
        {shown ? (
          <div
            className={cn("transition-opacity duration-150", error && "opacity-35")}
            dangerouslySetInnerHTML={{ __html: shown.svg }}
          />
        ) : (
          <div className="flex h-40 w-80 items-center justify-center p-6">
            {error ? (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span className="line-clamp-3">无法渲染：{error.message.split("\n")[0]}</span>
              </p>
            ) : (
              <div className="h-full w-full animate-pulse rounded-md bg-muted" />
            )}
          </div>
        )}

        {error && shown && (
          <div className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
            <CircleAlert className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {error.line > 0 ? `第 ${error.line} 行有语法错误` : "语法错误"}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})
