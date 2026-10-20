import { PeleError, render, type RenderResult } from "pele"

import { HAND_FONT, handDrawnCss, handDrawSvg } from "@/lib/hand-drawn"
import type { PeleVars } from "@/lib/themes"

export type Look = "classic" | "hand-drawn"

export type RenderSettings = {
  fontFamily: string
  fontFamilyMono: string
  fontSize: number
  padding: number
  look: Look
}

/**
 * Plain boxes (`[text]` and their kin in other diagrams) take Pele's radius,
 * which is set to square. Shapes that are rounded by definition, like
 * `(text)`, stadiums and states, carry their own radius and keep it.
 * Shared by the page and exported files.
 */
export const squareCornersCss = ".pele{--pele-radius:0px}"

export type DiagramError = {
  message: string
  line: number
  column: number
  snippet: string
}

/**
 * The human part of a Pele error. Parse errors end with the reason; lexical
 * errors lead with it and end with the source line and a caret.
 */
export function errorReason({ message, snippet }: DiagramError) {
  const lines = (snippet ? message.replace(snippet, "") : message)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
  const details = lines.filter((line) => !/^(Parse|Lexical) error on line \d+[:.]?$/.test(line))
  return (details.at(-1) ?? lines[0] ?? message).replace(/^(Parse|Lexical) error on line \d+[:.]\s*/, "")
}

export type DiagramRender =
  | { ok: true; result: RenderResult }
  | { ok: false; error: DiagramError }

// The canvas card and the editor panel render the same source; a small cache
// keeps that to one Pele call per change.
const cache = new Map<string, DiagramRender>()
const CACHE_LIMIT = 200

export function renderDiagram(code: string, settings: RenderSettings): DiagramRender {
  const key = `${settings.look}|${settings.fontFamily}|${settings.fontFamilyMono}|${settings.fontSize}|${settings.padding}|${code}`
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
    if (settings.look === "hand-drawn") {
      output.result = { ...output.result, svg: handDrawSvg(output.result.svg) }
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
// drawn into a canvas, so classic exports are measured and drawn with system
// fonts. Hand-drawn exports embed Recursive instead, to look as on the canvas.
const EXPORT_FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
const EXPORT_FONT_MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'

let embeddedHandFont: Promise<string> | null = null

/** Recursive's Latin face as an @font-face with a data URL, read once from the page's own CSS. */
function handFontFace() {
  embeddedHandFont ??= (async () => {
    const rule = [...document.styleSheets]
      .flatMap((sheet) => {
        try {
          return [...sheet.cssRules]
        } catch {
          return []
        }
      })
      .find(
        (r): r is CSSFontFaceRule =>
          r instanceof CSSFontFaceRule &&
          r.style.getPropertyValue("font-family").includes("Recursive Variable") &&
          // Browsers normalize the range, so "U+0000-00FF" can read back as "U+0-FF".
          /(^|,)\s*U\+0+-0*FF\s*(,|$)/i.test(r.style.getPropertyValue("unicode-range"))
      )
    const url = rule?.style.getPropertyValue("src").match(/url\(["']?([^"')]+)/)?.[1]
    if (!rule || !url) return ""
    // url() is relative to the stylesheet that declared it, not to the page.
    const response = await fetch(new URL(url, rule.parentStyleSheet?.href ?? document.baseURI))
    if (!response.ok) return ""
    const bytes = new Uint8Array(await response.arrayBuffer())
    let binary = ""
    for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
    return `@font-face{font-family:"Recursive Variable";src:url(data:font/woff2;base64,${btoa(binary)}) format("woff2");font-weight:300 1000}`
  })().then((css) => {
    // Retry on the next export instead of remembering a failure.
    if (!css) embeddedHandFont = null
    return css
  })
  return embeddedHandFont
}

export async function exportSvg(code: string, settings: RenderSettings, vars: PeleVars) {
  const hand = settings.look === "hand-drawn"
  const font = hand ? HAND_FONT : EXPORT_FONT
  const output = renderDiagram(code, { ...settings, fontFamily: font, fontFamilyMono: EXPORT_FONT_MONO })
  if (!output.ok) return null

  const declarations = Object.entries(vars)
    .map(([name, value]) => `${name}:${value}`)
    .join(";")
  const fontFace = hand ? await handFontFace() : ""
  const css = `${fontFace}.pele{${declarations};--pele-font:${font};--pele-font-mono:${EXPORT_FONT_MONO};background:var(--pele-bg)}${squareCornersCss}${hand ? handDrawnCss : ""}`
  const { svg, width, height } = output.result
  const tagEnd = svg.indexOf(">") + 1

  return { svg: `${svg.slice(0, tagEnd)}<style>${css}</style>${svg.slice(tagEnd)}`, width, height }
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
