import { PeleError, render, type RenderResult } from "pele"

import type { PeleVars } from "@/lib/themes"

export type RenderSettings = {
  fontFamily: string
  fontFamilyMono: string
  fontSize: number
  padding: number
}

export type DiagramError = {
  message: string
  line: number
  column: number
  snippet: string
}

export type DiagramRender =
  | { ok: true; result: RenderResult }
  | { ok: false; error: DiagramError }

// The canvas card and the editor panel render the same source; a small cache
// keeps that to one Pele call per change.
const cache = new Map<string, DiagramRender>()
const CACHE_LIMIT = 200

export function renderDiagram(code: string, settings: RenderSettings): DiagramRender {
  const key = `${settings.fontFamily}|${settings.fontFamilyMono}|${settings.fontSize}|${settings.padding}|${code}`
  const cached = cache.get(key)
  if (cached) return cached

  let output: DiagramRender
  try {
    output = {
      ok: true,
      result: render(code, {
        fontFamily: settings.fontFamily,
        fontFamilyMono: settings.fontFamilyMono,
        fontSize: settings.fontSize,
        padding: settings.padding,
        // Cards size themselves to the diagram; the canvas handles zoom.
        responsive: false,
        autoDirection: false,
      }),
    }
  } catch (error) {
    if (!(error instanceof PeleError)) throw error
    output = {
      ok: false,
      error: {
        message: error.message,
        line: error.line,
        column: error.column,
        snippet: error.snippet,
      },
    }
  }

  if (cache.size >= CACHE_LIMIT) {
    cache.delete(cache.keys().next().value!)
  }
  cache.set(key, output)
  return output
}

// Web fonts loaded by the page aren't visible to an SVG opened on its own or
// drawn into a canvas, so exports are measured and drawn with system fonts.
const EXPORT_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
const EXPORT_FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

export function exportSvg(code: string, settings: RenderSettings, vars: PeleVars) {
  const output = renderDiagram(code, {
    ...settings,
    fontFamily: EXPORT_FONT,
    fontFamilyMono: EXPORT_FONT_MONO,
  })
  if (!output.ok) return null

  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";")
  const style = `<style>.pele{${declarations};--pele-font:${EXPORT_FONT};--pele-font-mono:${EXPORT_FONT_MONO};background:var(--pele-bg)}</style>`
  const { svg, width, height } = output.result
  const tagEnd = svg.indexOf(">") + 1

  return { svg: svg.slice(0, tagEnd) + style + svg.slice(tagEnd), width, height }
}

export async function svgToPng(svg: string, width: number, height: number, background: string) {
  const scale = 2
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }))
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    const canvas = document.createElement("canvas")
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(height * scale)
    const context = canvas.getContext("2d")!
    context.fillStyle = background
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("PNG 编码失败"))), "image/png")
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
