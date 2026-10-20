"use client"

import { useMemo, useRef } from "react"

import { highlightMermaid } from "@/lib/highlight"
import { cn } from "@/lib/utils"

// The highlight layer and the textarea must lay text out identically, glyph
// for glyph, or the caret drifts away from the colored text under it.
const textLayout =
  "px-3 py-2 font-mono text-base leading-6 whitespace-pre [font-kerning:none] [font-variant-ligatures:none] [tab-size:2] md:text-[13px] md:leading-5"

/**
 * Monospace editor with a line-number gutter and Mermaid syntax colors; long
 * lines scroll instead of wrapping. The textarea's own text is transparent and
 * sits over a highlighted copy, so editing, IME and undo stay native.
 */
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
  const highlight = useRef<HTMLElement>(null)
  const lines = value.split("\n").length
  // A trailing newline needs a line of its own in the copy, as in the textarea.
  const html = useMemo(() => highlightMermaid(value) + "\n", [value])

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
      <div className="relative min-w-0 flex-1">
        <pre aria-hidden className="pointer-events-none absolute inset-0 m-0 overflow-hidden">
          <code
            ref={highlight}
            className={cn("code-highlight block w-max", textLayout)}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </pre>
        <textarea
          id="diagram-code"
          aria-label="Mermaid 代码"
          aria-invalid={invalid || undefined}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onScroll={(event) => {
            // The gutter and the colored copy follow the scroll without a re-render.
            const { scrollTop, scrollLeft } = event.currentTarget
            if (gutter.current) gutter.current.style.transform = `translateY(${-scrollTop}px)`
            if (highlight.current) highlight.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`
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
          className={cn(
            "relative block size-full resize-none overflow-auto bg-transparent text-transparent caret-foreground outline-none [scrollbar-width:thin] selection:bg-selection/25",
            textLayout
          )}
        />
      </div>
    </div>
  )
}
