"use client"

import { useEffect, useState } from "react"

import { useCanvasStore } from "@/lib/store"

// Browsers cap localStorage near 5 MB per site, counted in characters. No API
// reports the real quota, so the figures are an estimate against this.
export const STORAGE_LIMIT = 5 * 1024 * 1024

export type StorageLevel = "ok" | "warn" | "danger"

/** Characters used by every key on this site; the quota is shared by all of them. */
function measure() {
  let total = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    total += key.length + (localStorage.getItem(key)?.length ?? 0)
  }
  return total
}

/** Live usage in characters: re-measured after the canvas saves, at most every 250ms. */
export function useStorageUsage() {
  const [used, setUsed] = useState<number | null>(null)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const schedule = () => {
      if (timer) return
      timer = setTimeout(() => {
        timer = null
        try {
          setUsed(measure())
        } catch {
          // Storage blocked: nothing to report.
        }
      }, 250)
    }
    schedule()
    const unsubscribe = useCanvasStore.subscribe(schedule)
    // Another tab saving changes the total too.
    window.addEventListener("storage", schedule)
    return () => {
      unsubscribe()
      window.removeEventListener("storage", schedule)
      if (timer) clearTimeout(timer)
    }
  }, [])
  return used
}

export function storageLevel(used: number): StorageLevel {
  const percent = (used / STORAGE_LIMIT) * 100
  return percent >= 95 ? "danger" : percent >= 80 ? "warn" : "ok"
}

export function formatSize(chars: number) {
  if (chars < 1024) return `${chars} B`
  if (chars < 1024 * 1024) return `${(chars / 1024).toFixed(chars < 10 * 1024 ? 1 : 0)} KB`
  return `${(chars / 1024 / 1024).toFixed(2)} MB`
}

/** "< 1%" rather than a "0%" that reads as empty or broken. */
export function formatPercent(percent: number) {
  return percent > 0 && percent < 1 ? "< 1%" : `${Math.round(percent)}%`
}
