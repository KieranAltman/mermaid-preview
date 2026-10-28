"use client"

import { useState } from "react"
import { OctagonAlert, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { downloadBackup, exportMarkdown, exportZip } from "@/lib/actions"
import {
  STORAGE_LIMIT,
  formatPercent,
  formatSize,
  useCanvasUsage,
  type StorageLevel,
} from "@/lib/storage-usage"
import { useCanvasStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export const levelText: Record<StorageLevel, string> = {
  ok: "text-foreground",
  warn: "text-warning",
  danger: "text-danger",
}

export const levelMessage: Record<Exclude<StorageLevel, "ok">, string> = {
  warn: "空间用得差不多了。导出一份，再删掉不用的图表。",
  danger: "空间快满了，再保存可能失败。请先导出，再删掉不用的图表。",
}

export function LevelIcon({ level, className }: { level: StorageLevel; className?: string }) {
  if (level === "ok") return null
  const Icon = level === "danger" ? OctagonAlert : TriangleAlert
  return <Icon aria-hidden className={cn("size-3.5 shrink-0", levelText[level], className)} />
}

type Format = "zip" | "markdown" | "backup"

const formats: { id: Format; label: string; hint: string }[] = [
  { id: "zip", label: "ZIP", hint: "每张画布一个文件夹，每张图表一个 .mmd 文件。" },
  { id: "markdown", label: "Markdown", hint: "一个 .md 文件，画布是标题，图表是 mermaid 代码块。" },
  { id: "backup", label: "完整备份", hint: "一个 .json，包含全部画布、图表和设置。" },
]

// Canvases as slices of one bar, largest first, in fading steps of the same ink.
const shades = ["bg-foreground/70", "bg-foreground/45", "bg-foreground/30", "bg-foreground/20"]

/** Where the space goes, and an export of any set of canvases. */
export function StorageDialogContent({ used, level }: { used: number; level: StorageLevel }) {
  return (
    <DialogContent
      showCloseButton={false}
      className="flex max-h-[min(40rem,calc(100dvh-2rem))] flex-col gap-0 p-0 sm:max-w-md"
    >
      <StorageDialogBody used={used} level={level} />
    </DialogContent>
  )
}

// Inside the popup, so it measures only while open and starts fresh each time.
function StorageDialogBody({ used, level }: { used: number; level: StorageLevel }) {
  const usage = useCanvasUsage()
  const currentId = useCanvasStore((s) => s.currentCanvasId)
  const [format, setFormat] = useState<Format>("zip")
  // Every canvas is chosen until the user unticks one.
  const [chosen, setChosen] = useState(() => usage.map((u) => u.canvas.id))

  const rows = [...usage].sort((a, b) => b.size - a.size)
  const other = Math.max(0, used - usage.reduce((sum, u) => sum + u.size, 0))
  const percent = Math.min(100, (used / STORAGE_LIMIT) * 100)
  const all = chosen.length === usage.length
  const diagrams = usage.filter((u) => chosen.includes(u.canvas.id)).reduce((sum, u) => sum + u.diagrams, 0)
  const backup = format === "backup"
  const toggle = (id: string, on: boolean) => setChosen(on ? [...chosen, id] : chosen.filter((c) => c !== id))

  const run = () => {
    if (backup) {
      downloadBackup()
      toast.success("已导出完整备份")
    }
    // Exports keep list order, whatever order they were ticked in.
    else (format === "zip" ? exportZip : exportMarkdown)(chosen)
  }

  return (
    <>
      <DialogHeader className="gap-1 p-4 pb-3">
        <DialogTitle className="text-sm">存储与导出</DialogTitle>
        <DialogDescription className="text-xs text-pretty">
          图表只存在这个浏览器里。导出一份，换设备或清理浏览器数据时就不会丢。
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2 px-4 pb-3">
        <p className="flex items-baseline justify-between text-xs text-muted-foreground tabular-nums">
          <span>
            <span className={cn("text-base font-medium", levelText[level])}>{formatSize(used)}</span> / 5 MB
          </span>
          {formatPercent(percent)}
        </p>
        <div aria-hidden className="flex h-2 overflow-hidden rounded-full bg-foreground/8">
          {rows.map((row, i) => (
            <span
              key={row.canvas.id}
              className={cn("h-full border-r border-popover last:border-r-0", shades[Math.min(i, shades.length - 1)])}
              style={{ width: `${(row.size / STORAGE_LIMIT) * 100}%`, minWidth: 2 }}
            />
          ))}
          {/* The rest of the total, so the bar fills as far as the figure says. */}
          <span className="h-full bg-foreground/15" style={{ width: `${(other / STORAGE_LIMIT) * 100}%` }} />
        </div>
        {level !== "ok" && (
          <p className={cn("flex gap-1.5 text-xs text-pretty", levelText[level])}>
            <LevelIcon level={level} className="mt-px" />
            {levelMessage[level]}
          </p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-y">
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-popover text-muted-foreground">
            <tr className="h-8">
              <th className="w-10 pl-4 text-left font-normal">
                <Checkbox
                  aria-label="选择全部画布"
                  checked={all}
                  indeterminate={chosen.length > 0 && !all}
                  disabled={backup}
                  onCheckedChange={(on) => setChosen(on ? usage.map((u) => u.canvas.id) : [])}
                />
              </th>
              <th className="text-left font-normal">画布</th>
              <th className="w-12 text-right font-normal">图表</th>
              <th className="w-20 pr-4 text-right font-normal">大小</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const on = backup || chosen.includes(row.canvas.id)
              return (
                <tr
                  key={row.canvas.id}
                  // The whole row ticks its box; the box itself handles its own clicks.
                  onClick={(event) => {
                    if (backup || (event.target as Element).closest("[data-slot=checkbox]")) return
                    toggle(row.canvas.id, !on)
                  }}
                  className={cn("h-8 transition-colors duration-150", !backup && "cursor-default hover:bg-muted/60")}
                >
                  <td className="pl-4">
                    <Checkbox
                      aria-label={`导出「${row.canvas.name}」`}
                      checked={on}
                      disabled={backup}
                      onCheckedChange={(next) => toggle(row.canvas.id, next)}
                    />
                  </td>
                  <td className="max-w-0 pr-2">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{row.canvas.name}</span>
                      {row.canvas.id === currentId && (
                        <span className="shrink-0 rounded-sm bg-muted px-1 text-[0.6875rem] text-muted-foreground">
                          当前
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="text-right text-muted-foreground tabular-nums">{row.diagrams}</td>
                  <td className="pr-4 text-right tabular-nums">{formatSize(row.size)}</td>
                </tr>
              )
            })}
            <tr className="h-8 text-muted-foreground">
              <td />
              <td>设置与其他</td>
              <td />
              <td className="pr-4 text-right tabular-nums">{formatSize(other)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 p-4 pt-3">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="导出格式"
          value={[format]}
          onValueChange={(value) => value[0] && setFormat(value[0] as Format)}
        >
          {formats.map((f) => (
            <ToggleGroupItem key={f.id} value={f.id}>
              {f.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="text-xs text-muted-foreground">{formats.find((f) => f.id === format)!.hint}</p>
        <div className="mt-1 flex items-center justify-end gap-2">
          <DialogClose render={<Button variant="ghost" />}>取消</DialogClose>
          <DialogClose render={<Button disabled={!backup && chosen.length === 0} onClick={run} />}>
            {backup
              ? "导出完整备份"
              : all
                ? `导出全部 ${diagrams} 张图表`
                : `导出 ${chosen.length} 张画布 · ${diagrams} 张图表`}
          </DialogClose>
        </div>
      </div>
    </>
  )
}
