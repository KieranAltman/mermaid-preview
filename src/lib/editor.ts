import { useCanvasStore } from "@/lib/store"

// Where focus goes back to when the editor closes: the control that opened it,
// or nowhere (canvas shortcuts keep working) when it opened from the canvas.
let returnFocus: HTMLElement | null = null

export function openEditor() {
  const active = document.activeElement
  returnFocus = active instanceof HTMLElement && active !== document.body ? active : null
  useCanvasStore.getState().setEditorOpen(true)
  // The dock stays inert until this update commits.
  requestAnimationFrame(() => document.getElementById("diagram-code")?.focus({ preventScroll: true }))
}

export function closeEditor() {
  useCanvasStore.getState().setEditorOpen(false)
  if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
  else (document.activeElement as HTMLElement | null)?.blur()
  returnFocus = null
}

export function toggleEditor() {
  if (useCanvasStore.getState().editorOpen) closeEditor()
  else openEditor()
}
