import { HAND_FONT } from "@/lib/hand-drawn"
import type { Look } from "@/lib/pele"
import { useCanvasStore } from "@/lib/store"

let loading: Promise<void> | null = null

/** Loads Recursive before the first hand-drawn render, so Pele measures with it. */
export function loadHandFont() {
  loading ??= Promise.all([
    document.fonts.load(`16px ${HAND_FONT}`),
    document.fonts.load(`bold 16px ${HAND_FONT}`),
  ])
    .catch(() => undefined)
    .then(() => useCanvasStore.getState().setHandFontReady())
  return loading
}

export function setLook(look: Look) {
  useCanvasStore.getState().updateSettings({ look })
  if (look === "hand-drawn") void loadHandFont()
}
