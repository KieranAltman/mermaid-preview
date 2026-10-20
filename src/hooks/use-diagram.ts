"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"

import { renderDiagram, type RenderSettings } from "@/lib/pele"
import { useCanvasStore } from "@/lib/store"
import { getDiagramTheme } from "@/lib/themes"

export function useDebouncedValue<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

/** Null until the page fonts have loaded, since Pele measures labels with them. */
export function useRenderSettings(): RenderSettings | null {
  const fonts = useCanvasStore((s) => s.fonts)
  const fontSize = useCanvasStore((s) => s.settings.fontSize)
  const padding = useCanvasStore((s) => s.settings.padding)
  return useMemo(
    () => (fonts ? { fontFamily: fonts.sans, fontFamilyMono: fonts.mono, fontSize, padding } : null),
    [fonts, fontSize, padding]
  )
}

export function useDiagramRender(code: string) {
  const settings = useRenderSettings()
  const debouncedCode = useDebouncedValue(code, 160)
  return useMemo(
    () => (settings ? renderDiagram(debouncedCode, settings) : null),
    [debouncedCode, settings]
  )
}

export function useDiagramVars() {
  const themeId = useCanvasStore((s) => s.settings.themeId)
  const { resolvedTheme } = useTheme()
  const theme = getDiagramTheme(themeId)
  return resolvedTheme === "dark" ? theme.dark : theme.light
}
