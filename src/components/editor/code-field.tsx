"use client"

import { useRef } from "react"

import { cn } from "@/lib/utils"

/** Monospace editor with a line-number gutter; long lines scroll instead of wrapping. */
export function CodeField({
  value,
  onChange,
  invalid,
  errorLine,
  onEscape,
  className,
}: {
  value: string
  onChange: (value: string) => void
  invalid?: boolean
  errorLine?: number | null
  onEscape?: () => void
  className?: string
}) {
  const gutter = useRef<HTMLDivElement>(null)
  const lines = value.split("\n").length

  return (
    <div className={cn("flex min-h-0 overflow-hidden bg-field", className)}>
      <div
        aria-hidden
        className="w-11 shrink-0 overflow-hidden border-r py-2 pr-2.5 text-right font-mono text-xs leading-6 text-muted-foreground/70 tabular-nums select-none md:leading-5"
      >
        <div ref={gutter}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className={cn(i + 1 === errorLine && "text-destructive")}>
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <textarea
        id="diagram-code"
        aria-label="Mermaid 代码"
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          // The gutter follows the textarea's scroll without a re-render.
          if (gutter.current) gutter.current.style.transform = `translateY(${-event.currentTarget.scrollTop}px)`
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && onEscape) {
            event.preventDefault()
            onEscape()
          } else if (event.key === "Tab" && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
            event.preventDefault()
            // execCommand keeps the native undo stack, unlike setting the value.
            document.execCommand("insertText", false, "  ")
          }
        }}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        data-1p-ignore
        className="min-h-0 min-w-0 flex-1 resize-none overflow-auto bg-transparent px-3 py-2 font-mono text-base leading-6 whitespace-pre outline-none [scrollbar-width:thin] [tab-size:2] md:text-[13px] md:leading-5"
      />
    </div>
  )
}
