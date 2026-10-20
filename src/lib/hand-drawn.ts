import rough from "roughjs"
import type { Options } from "roughjs/bin/core"

export const HAND_FONT = '"Recursive Variable", arial, sans-serif'

// Mermaid's own hand-drawn defaults (handDrawnShapeStyles.ts), so diagrams
// look like they would in mermaid.live with `look: handDrawn`.
const BASE: Options = { roughness: 0.7, fillStyle: "hachure", fillWeight: 1.5, hachureGap: 1.5, strokeWidth: 1.3 }

/** Seeds keyed by position, so an unchanged shape keeps its wobble across re-renders. */
function seedFor(index: number) {
  let h = 2166136261 ^ index
  h = Math.imul(h ^ (h >>> 13), 16777619)
  return (h >>> 0) % 2 ** 31
}

const inherited = (el: Element, name: string) => el.getAttribute(name) ?? el.closest(`[${name}]`)?.getAttribute(name) ?? null

function roundedRectPath(x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2)
  return `M${x + r},${y}H${x + w - r}A${r},${r} 0 0 1 ${x + w},${y + r}V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}H${x + r}A${r},${r} 0 0 1 ${x},${y + h - r}V${y + r}A${r},${r} 0 0 1 ${x + r},${y}Z`
}

/**
 * Redraws a Pele SVG's outlines with rough.js. Layout, text and colors stay
 * Pele's: strokes and fills keep their CSS variables, so themes still apply.
 * Label backgrounds and filled arrowheads are left crisp.
 */
export function handDrawSvg(svgMarkup: string) {
  const doc = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
  const svg = doc.documentElement as unknown as SVGSVGElement
  const rc = rough.svg(svg)
  let index = 0

  for (const el of [...svg.querySelectorAll("rect, polygon, ellipse, circle, path, line, polyline")]) {
    const stroke = inherited(el, "stroke")
    if (!stroke || stroke === "none" || el.classList.contains("pele-marker")) continue
    const fillValue = inherited(el, "fill")
    const open = el.tagName === "line" || el.tagName === "polyline"
    const dash = inherited(el, "stroke-dasharray")?.split(/[\s,]+/).map(Number)
    const options: Options = {
      ...BASE,
      seed: seedFor(index++),
      stroke,
      fill: !open && fillValue && fillValue !== "none" ? fillValue : undefined,
      strokeLineDash: dash,
      fillLineDash: [0, 0],
    }
    const n = (name: string) => parseFloat(el.getAttribute(name) ?? "0") || 0

    let drawn: SVGGElement
    switch (el.tagName) {
      case "rect": {
        // A numeric rx means a shape rounded by definition, like `(text)`; plain
        // boxes reference Pele's radius variable, which is square.
        const radius = n("rx")
        drawn = radius
          ? rc.path(roundedRectPath(n("x"), n("y"), n("width"), n("height"), radius), options)
          : rc.rectangle(n("x"), n("y"), n("width"), n("height"), options)
        break
      }
      case "polygon":
        drawn = rc.polygon(
          (el.getAttribute("points") ?? "")
            .trim()
            .split(/\s+/)
            .map((point) => point.split(",").map(Number) as [number, number]),
          options
        )
        break
      case "ellipse":
        drawn = rc.ellipse(n("cx"), n("cy"), n("rx") * 2, n("ry") * 2, options)
        break
      case "circle":
        drawn = rc.circle(n("cx"), n("cy"), n("r") * 2, options)
        break
      case "line":
        drawn = rc.line(n("x1"), n("y1"), n("x2"), n("y2"), options)
        break
      case "polyline":
        drawn = rc.linearPath(
          (el.getAttribute("points") ?? "")
            .trim()
            .split(/\s+/)
            .map((point) => point.split(",").map(Number) as [number, number]),
          options
        )
        break
      default:
        drawn = rc.path(el.getAttribute("d") ?? "", options)
    }
    const transform = el.getAttribute("transform")
    if (transform) drawn.setAttribute("transform", transform)
    el.replaceWith(drawn)
  }

  // Lets CSS switch the labels to Recursive's casual forms (see globals.css).
  svg.setAttribute("data-look", "hand-drawn")
  return new XMLSerializer().serializeToString(svg)
}

/**
 * The CSS hand-drawn diagrams need wherever they're shown or exported: draw
 * labels in the font Pele measured them with, in its casual forms.
 */
export const handDrawnCss = `.pele[data-look="hand-drawn"]{--pele-font:${HAND_FONT}}.pele[data-look="hand-drawn"] text{font-variation-settings:"CASL" 1}`
