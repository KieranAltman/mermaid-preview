"use client"

import { useMemo } from "react"

import { RenderStatus } from "@/components/editor/render-status"
import { toggleEditor } from "@/lib/editor"
import { highlightMermaid } from "@/lib/highlight"
import { useCanvasStore, type Diagram } from "@/lib/store"
import { cn } from "@/lib/utils"

/** The inspector's stand-in for the editor: the first lines, opening the dock. */
export function CodePreview({ diagram }: { diagram: Diagram }) {
  const open = useCanvasStore((s) => s.editorOpen)
  const lines = diagram.code.split("\n")
  const label = open ? "收起代码编辑器" : "编辑代码"
  const head = lines.slice(0, 6).join("\n")
  const html = useMemo(() => highlightMermaid(head), [head])

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="shrink-0 text-sm font-medium whitespace-nowrap">Mermaid 代码</span>
        <RenderStatus code={diagram.code} className="min-w-0" />
      </div>
      <button
        type="button"
        onClick={toggleEditor}
        aria-label={`${label}（共 ${lines.length} 行）`}
        aria-pressed={open}
        className={cn(
          "relative block w-full overflow-hidden rounded-lg border border-input bg-field text-left outline-none transition-[border-color,box-shadow] duration-150 hover:border-ring/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          open && "border-ring ring-3 ring-ring/30"
        )}
      >
        <pre
          aria-hidden
          className="code-highlight max-h-[7.75rem] overflow-hidden px-3 pt-2 pb-8 font-mono text-xs leading-5 text-foreground/80 mask-b-from-50% mask-b-to-100% [font-variant-ligatures:none]"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <span
          aria-hidden
          className="absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md bg-raised px-2 py-1 text-xs font-medium text-foreground shadow-(--raised-shadow)"
        >
          {label}
          <kbd className="font-sans text-muted-foreground">↵</kbd>
        </span>
      </button>
    </div>
  )
}
