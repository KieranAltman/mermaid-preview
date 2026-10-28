import { toast } from "sonner"

import { useCanvasStore } from "@/lib/store"
import { stopViewportAnimation } from "@/lib/viewport"

export function openCanvas(id: string) {
  // A camera move still running would land on the next canvas.
  stopViewportAnimation()
  useCanvasStore.getState().switchCanvas(id)
}

/** Creates a canvas, switches to it and returns its id. */
export function createCanvas() {
  stopViewportAnimation()
  return useCanvasStore.getState().addCanvas()
}

export function deleteCanvas(id: string) {
  const { removeCanvas, restoreCanvas } = useCanvasStore.getState()
  stopViewportAnimation()
  const removed = removeCanvas(id)
  if (!removed) return
  toast(`已删除画布「${removed.canvas.name}」`, {
    action: {
      label: "撤销",
      onClick: () => {
        stopViewportAnimation()
        restoreCanvas(removed)
      },
    },
  })
}

/** Moves diagrams to another canvas without leaving this one; the toast offers the way there. */
export function moveToCanvas(ids: string[], canvasId: string) {
  const { moveDiagramsToCanvas } = useCanvasStore.getState()
  moveDiagramsToCanvas(ids, canvasId)
  const { canvases, diagrams } = useCanvasStore.getState()
  const name = canvases.find((c) => c.id === canvasId)?.name
  const moved = diagrams.filter((d) => ids.includes(d.id) && d.canvasId === canvasId)
  if (!name || moved.length === 0) return
  const message = moved.length === 1 ? `已将「${moved[0].title}」移到「${name}」` : `已将 ${moved.length} 张图表移到「${name}」`
  toast(message, {
    action: {
      label: "前往",
      onClick: () => {
        openCanvas(canvasId)
        useCanvasStore.getState().setSelection(moved.map((d) => d.id))
      },
    },
  })
}

/** Returns the new canvas's id. */
export function moveToNewCanvas(ids: string[]) {
  const canvasId = useCanvasStore.getState().addCanvas({ switchTo: false })
  moveToCanvas(ids, canvasId)
  return canvasId
}
