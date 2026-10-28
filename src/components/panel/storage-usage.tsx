"use client"

import { LevelIcon, StorageDialogContent, levelMessage, levelText } from "@/components/panel/storage-dialog"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { STORAGE_LIMIT, formatPercent, formatSize, storageLevel, useStorageUsage, type StorageLevel } from "@/lib/storage-usage"
import { cn } from "@/lib/utils"

const levelFill: Record<StorageLevel, string> = {
  ok: "bg-foreground/60",
  warn: "bg-warning",
  danger: "bg-destructive",
}

/** How much of the browser's local storage the canvas has used, above the panel footer. Opens storage and export. */
export function StorageUsage() {
  const used = useStorageUsage()
  if (used === null) return null
  const level = storageLevel(used)
  const percent = Math.min(100, (used / STORAGE_LIMIT) * 100)

  return (
    <div className="shrink-0 px-2 pt-0.5 pb-1.5">
      <Dialog>
        <DialogTrigger
          aria-label={`本地存储已用 ${formatSize(used)}，约占 ${formatPercent(percent)}。存储与导出`}
          className="flex w-full flex-col gap-2 rounded-md px-2 pt-1.5 pb-2.5 text-left transition-colors duration-150 outline-none hover:bg-sidebar-hover focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-sidebar-hover"
        >
          <span className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              本地存储
              <LevelIcon level={level} />
            </span>
            <span className="tabular-nums">
              <span className={levelText[level]}>{formatSize(used)}</span> / 5 MB
            </span>
          </span>
          <span
            role="meter"
            aria-label="本地存储占用"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percent)}
            aria-valuetext={`已用 ${formatSize(used)}，约占 ${formatPercent(percent)}`}
            className="relative block h-1 overflow-hidden rounded-full bg-foreground/8"
          >
            {/* Scales on transform rather than animating width. */}
            <span
              className={cn(
                "absolute inset-0 origin-left rounded-full transition-[scale,background-color] duration-300 ease-out-quint",
                levelFill[level]
              )}
              style={{ scale: `${Math.max(percent, 0.5) / 100} 1` }}
            />
          </span>
        </DialogTrigger>
        <StorageDialogContent used={used} level={level} />
      </Dialog>
      {/* The words live in the dialog; screen readers still hear the change. */}
      <span role="status" className="sr-only">
        {level === "ok" ? "" : levelMessage[level]}
      </span>
    </div>
  )
}
