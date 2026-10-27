"use client"

import { Popover } from "@base-ui/react/popover"
import { OctagonAlert, TriangleAlert } from "lucide-react"

import { downloadBackup } from "@/lib/actions"
import {
  STORAGE_LIMIT,
  formatPercent,
  formatSize,
  storageLevel,
  useStorageUsage,
  type StorageLevel,
} from "@/lib/storage-usage"
import { cn } from "@/lib/utils"

type Alert = Exclude<StorageLevel, "ok">

const levelText: Record<StorageLevel, string> = {
  ok: "text-foreground",
  warn: "text-warning",
  danger: "text-danger",
}

const levelFill: Record<StorageLevel, string> = {
  ok: "bg-foreground/60",
  warn: "bg-warning",
  danger: "bg-destructive",
}

const alertCopy: Record<Alert, { label: string; message: string }> = {
  warn: {
    label: "存储空间不多了，查看说明",
    message: "空间用得差不多了，可以导出备份后删掉不用的图表。",
  },
  danger: {
    label: "存储空间快满了，查看说明",
    message: "空间快满了，再保存可能失败。请先导出备份，再删除不用的图表。",
  },
}

/**
 * Looks like the app's tooltips, but it's a popover that opens on hover: a
 * tooltip can't hold the backup button, since it closes as the pointer heads
 * for it. Click, Enter or a tap opens it too.
 */
function StorageAlert({ level }: { level: Alert }) {
  const Icon = level === "danger" ? OctagonAlert : TriangleAlert
  return (
    <Popover.Root>
      <Popover.Trigger
        openOnHover
        delay={150}
        closeDelay={200}
        aria-label={alertCopy[level].label}
        className={cn(
          // 24px button, with the hit area grown to 40px around it.
          "relative -my-1 flex size-6 items-center justify-center rounded-md transition-colors duration-150 outline-none before:absolute before:-inset-2 hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-sidebar-accent",
          levelText[level]
        )}
      >
        <Icon className="size-3.5" aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="start" sideOffset={6} className="z-50">
          <Popover.Popup className="max-w-60 origin-(--transform-origin) rounded-md bg-foreground px-3 py-2 text-xs leading-5 text-background outline-none transition-[opacity,scale] duration-125 ease-out-quint data-ending-style:scale-97 data-ending-style:opacity-0 data-ending-style:duration-100 data-ending-style:ease-in data-starting-style:scale-97 data-starting-style:opacity-0">
            <Popover.Description className="text-pretty">{alertCopy[level].message}</Popover.Description>
            <button
              type="button"
              onClick={downloadBackup}
              className="mt-1 font-medium underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-background/50"
            >
              导出备份
            </button>
            <Popover.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground data-[side=top]:-bottom-2.5" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** How much of the browser's local storage the canvas has used, above the panel footer. */
export function StorageUsage() {
  const used = useStorageUsage()
  if (used === null) return null
  const level = storageLevel(used)
  const percent = Math.min(100, (used / STORAGE_LIMIT) * 100)

  return (
    <div className="flex shrink-0 flex-col gap-2 px-4 pt-1 pb-3">
      <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          本地存储
          {level !== "ok" && <StorageAlert level={level} />}
        </span>
        <span className="tabular-nums">
          <span className={levelText[level]}>{formatSize(used)}</span> / 5 MB
        </span>
      </div>
      <div
        role="meter"
        aria-label="本地存储占用"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
        aria-valuetext={`已用 ${formatSize(used)}，约占 ${formatPercent(percent)}`}
        className="relative h-1 overflow-hidden rounded-full bg-foreground/8"
      >
        {/* Scales on transform rather than animating width. */}
        <span
          className={cn(
            "absolute inset-0 origin-left rounded-full transition-[scale,background-color] duration-300 ease-out-quint",
            levelFill[level]
          )}
          style={{ scale: `${Math.max(percent, 0.5) / 100} 1` }}
        />
      </div>
      {/* The words live in the popover; screen readers still hear the change. */}
      <span role="status" className="sr-only">
        {level === "ok" ? "" : alertCopy[level].message}
      </span>
    </div>
  )
}
