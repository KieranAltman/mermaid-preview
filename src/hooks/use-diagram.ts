"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"

import { HAND_FONT } from "@/lib/hand-drawn"
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

/**
 * Null until the fonts Pele measures with have loaded: the page fonts, plus
 * Recursive for the hand-drawn look. Cards keep their last drawing meanwhile.
 */
export function useRenderSettings(): RenderSettings | null {
  const fonts = useCanvasStore((s) => s.fonts)
  const handFontReady = useCanvasStore((s) => s.handFontReady)
  const fontSize = useCanvasStore((s) => s.settings.fontSize)
  const padding = useCanvasStore((s) => s.settings.padding)
  const look = useCanvasStore((s) => s.settings.look)
  return useMemo(() => {
    if (!fonts || (look === "hand-drawn" && !handFontReady)) return null
    const fontFamily = look === "hand-drawn" ? HAND_FONT : fonts.sans
    return { fontFamily, fontFamilyMono: fonts.mono, fontSize, padding, look }
  }, [fonts, handFontReady, fontSize, padding, look])
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
