import { toast } from "sonner"

import { downloadBlob, exportSvg, svgToPng, type RenderSettings } from "@/lib/pele"
import { useCanvasStore } from "@/lib/store"
import type { PeleVars } from "@/lib/themes"
import { zip, type ZipEntry } from "@/lib/zip"

export function deleteDiagrams(ids: string[]) {
  const { removeDiagrams, restoreDiagrams } = useCanvasStore.getState()
  const removed = removeDiagrams(ids)
  if (removed.length === 0) return
  const message = removed.length === 1 ? `已删除「${removed[0].title}」` : `已删除 ${removed.length} 张图表`
  toast(message, {
    action: { label: "撤销", onClick: () => restoreDiagrams(removed) },
  })
}

function safeName(name: string, fallback: string) {
  return name.trim().replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "-").replace(/^\.+/, "") || fallback
}

function fileName(title: string, extension: string) {
  return `${safeName(title, "diagram")}.${extension}`
}

/** Safe names, numbered when two would land on the same file: "草稿", "草稿 (2)". */
function uniqueNames(names: string[], fallback: string) {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const base = safeName(name, fallback)
    const n = (seen.get(base.toLowerCase()) ?? 0) + 1
    seen.set(base.toLowerCase(), n)
    return n === 1 ? base : `${base} (${n})`
  })
}

type ExportInput = {
  title: string
  code: string
  settings: RenderSettings
  vars: PeleVars
}

async function standalone({ code, settings, vars }: ExportInput) {
  const output = await exportSvg(code, settings, vars)
  if (!output) toast.error("图表有语法错误，修复后才能导出")
  return output
}

export async function copySvg(input: ExportInput) {
  const output = await standalone(input)
  if (!output) return
  await navigator.clipboard.writeText(output.svg)
  toast.success("SVG 已复制到剪贴板")
}

export async function downloadSvg(input: ExportInput) {
  const output = await standalone(input)
  if (!output) return
  downloadBlob(new Blob([output.svg], { type: "image/svg+xml" }), fileName(input.title, "svg"))
}

export async function downloadPng(input: ExportInput) {
  const output = await standalone(input)
  if (!output) return
  try {
    const blob = await svgToPng(output.svg, output.width, output.height, input.vars["--pele-bg"])
    downloadBlob(blob, fileName(input.title, "png"))
  } catch {
    toast.error("PNG 导出失败，请改用 SVG 导出")
  }
}

export async function copyCode(code: string) {
  await navigator.clipboard.writeText(code)
  toast.success("Mermaid 代码已复制")
}

const today = () => new Date().toISOString().slice(0, 10)

/** Downloads the saved canvas as JSON: otherwise its only copy lives in this browser. */
export function downloadBackup() {
  const data = localStorage.getItem(useCanvasStore.persist.getOptions().name!) ?? "{}"
  downloadBlob(new Blob([data], { type: "application/json" }), `mermaid-preview-备份-${today()}.json`)
}

/** The chosen canvases in list order, each with its diagrams. */
function canvasGroups(canvasIds: string[]) {
  const { canvases, diagrams } = useCanvasStore.getState()
  return canvases
    .filter((c) => canvasIds.includes(c.id))
    .map((canvas) => ({ canvas, diagrams: diagrams.filter((d) => d.canvasId === canvas.id) }))
}

function exported(groups: ReturnType<typeof canvasGroups>) {
  const diagrams = groups.reduce((sum, g) => sum + g.diagrams.length, 0)
  toast.success(groups.length === 1 ? `已导出 ${diagrams} 张图表` : `已导出 ${groups.length} 张画布、${diagrams} 张图表`)
}

/** A ZIP with a folder per canvas and a .mmd per diagram; empty canvases keep their folder. */
export function exportZip(canvasIds: string[]) {
  const groups = canvasGroups(canvasIds)
  const folders = uniqueNames(
    groups.map((g) => g.canvas.name),
    "canvas"
  )
  const entries: ZipEntry[] = groups.flatMap((group, i) => {
    const files = uniqueNames(
      group.diagrams.map((d) => d.title),
      "diagram"
    )
    return [
      { path: `${folders[i]}/`, text: null },
      ...group.diagrams.map((d, j) => ({ path: `${folders[i]}/${files[j]}.mmd`, text: d.code })),
    ]
  })
  const name = groups.length === 1 ? folders[0] : "mermaid-preview"
  downloadBlob(zip(entries), `${name}-${today()}.zip`)
  exported(groups)
}

/** One Markdown file: a heading per canvas, a mermaid code block per diagram. */
export function exportMarkdown(canvasIds: string[]) {
  const groups = canvasGroups(canvasIds)
  const block = (code: string) => {
    // The fence outruns any backticks inside the code.
    const fence = "`".repeat(Math.max(3, ...(code.match(/`+/g) ?? []).map((run) => run.length + 1)))
    return `${fence}mermaid\n${code}\n${fence}`
  }
  const sections = groups.map(({ canvas, diagrams }) =>
    [`## ${canvas.name}`, ...(diagrams.length ? diagrams.map((d) => `### ${d.title}\n\n${block(d.code)}`) : ["（空画布）"])].join(
      "\n\n"
    )
  )
  const markdown = [`# Mermaid Preview · ${today()}`, ...sections].join("\n\n") + "\n"
  downloadBlob(new Blob([markdown], { type: "text/markdown" }), `mermaid-preview-${today()}.md`)
  exported(groups)
}
