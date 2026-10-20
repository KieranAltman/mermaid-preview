import { toast } from "sonner"

import { downloadBlob, exportSvg, svgToPng, type RenderSettings } from "@/lib/pele"
import { useCanvasStore } from "@/lib/store"
import type { PeleVars } from "@/lib/themes"

export function deleteDiagrams(ids: string[]) {
  const { removeDiagrams, restoreDiagrams } = useCanvasStore.getState()
  const removed = removeDiagrams(ids)
  if (removed.length === 0) return
  const message = removed.length === 1 ? `已删除「${removed[0].title}」` : `已删除 ${removed.length} 张图表`
  toast(message, {
    action: { label: "撤销", onClick: () => restoreDiagrams(removed) },
  })
}

function fileName(title: string, extension: string) {
  const base = title.trim().replace(/[\\/:*?"<>|]+/g, "-") || "diagram"
  return `${base}.${extension}`
}

type ExportInput = {
  title: string
  code: string
  settings: RenderSettings
  vars: PeleVars
}

function standalone({ code, settings, vars }: ExportInput) {
  const output = exportSvg(code, settings, vars)
  if (!output) toast.error("图表有语法错误，修复后才能导出")
  return output
}

export async function copySvg(input: ExportInput) {
  const output = standalone(input)
  if (!output) return
  await navigator.clipboard.writeText(output.svg)
  toast.success("SVG 已复制到剪贴板")
}

export function downloadSvg(input: ExportInput) {
  const output = standalone(input)
  if (!output) return
  downloadBlob(new Blob([output.svg], { type: "image/svg+xml" }), fileName(input.title, "svg"))
}

export async function downloadPng(input: ExportInput) {
  const output = standalone(input)
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
