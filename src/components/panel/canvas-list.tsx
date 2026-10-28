"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, Ellipsis, Plus } from "lucide-react"
import { useShallow } from "zustand/react/shallow"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { createCanvas, deleteCanvas, openCanvas } from "@/lib/canvases"
import { useCanvasStore, type Canvas } from "@/lib/store"
import { cn } from "@/lib/utils"

const ROW = 32
const GAP = 1
// Until the list is resized, past this many rows it scrolls; the half row shows there is more.
const VISIBLE_ROWS = 5
// The list never takes more than this share of the window, so the layers keep room.
const MAX_SHARE = 0.5
const STEP = 16

const rowsHeight = (rows: number) => rows * ROW + (Math.ceil(rows) - 1) * GAP

/**
 * The rule under the canvas list doubles as its resize handle: drag it, or
 * ↑/↓ on the focused handle; a double-click fits the list to its rows again.
 */
function ListResizeHandle({
  height,
  max,
  onResize,
  onReset,
}: {
  height: number
  max: number
  onResize: (height: number) => void
  onReset: () => void
}) {
  const clampHeight = (next: number) => Math.round(Math.min(max, Math.max(ROW, next)))

  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    // Keeps the drag from selecting text on its way down the panel.
    event.preventDefault()
    const handle = event.currentTarget
    const startY = event.clientY
    const startHeight = height
    handle.setPointerCapture(event.pointerId)
    const move = (e: PointerEvent) => onResize(clampHeight(startHeight + e.clientY - startY))
    const end = () => {
      handle.removeEventListener("pointermove", move)
      handle.removeEventListener("pointerup", end)
      handle.removeEventListener("pointercancel", end)
    }
    handle.addEventListener("pointermove", move)
    handle.addEventListener("pointerup", end)
    handle.addEventListener("pointercancel", end)
  }

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="调整画布列表高度"
      aria-controls="canvas-list"
      aria-valuemin={ROW}
      aria-valuemax={max}
      aria-valuenow={height}
      tabIndex={0}
      onPointerDown={startResize}
      onDoubleClick={onReset}
      onKeyDown={(event) => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return
        event.preventDefault()
        onResize(clampHeight(height + (event.key === "ArrowDown" ? STEP : -STEP)))
      }}
      // 8px to grab, centered on the section's 1px bottom border.
      className="group/handle absolute inset-x-0 -bottom-[4.5px] z-10 h-2 cursor-row-resize touch-none outline-none"
    >
      {/* Lights up like the panel edges: once the pointer settles, at once while dragging or focused. */}
      <span className="absolute inset-x-0 top-[3px] h-0.5 bg-ring opacity-0 transition-opacity duration-150 group-hover/handle:opacity-100 group-hover/handle:delay-200 group-focus-visible/handle:opacity-100 group-focus-visible/handle:delay-0 group-active/handle:opacity-100 group-active/handle:delay-0" />
    </div>
  )
}

function RenameField({ canvas, onDone }: { canvas: Canvas; onDone: () => void }) {
  const renameCanvas = useCanvasStore((s) => s.renameCanvas)
  const ref = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(canvas.name)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const commit = () => {
    renameCanvas(canvas.id, value)
    onDone()
  }

  return (
    <input
      ref={ref}
      value={value}
      aria-label="画布名称"
      autoComplete="off"
      spellCheck={false}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit()
        else if (event.key === "Escape") onDone()
      }}
      // 16px on phones so iOS doesn't zoom in on focus.
      className="h-8 w-full min-w-0 rounded-md bg-field px-2 text-base ring-2 ring-ring/50 outline-none md:text-xs"
    />
  )
}

function CanvasRow({
  canvas,
  count,
  current,
  deletable,
  renaming,
  onRename,
  onRenamed,
  onDelete,
}: {
  canvas: Canvas
  count: number
  current: boolean
  deletable: boolean
  renaming: boolean
  onRename: () => void
  onRenamed: () => void
  onDelete: () => void
}) {
  // Choosing "rename" in a menu must not hand focus back to the row as the
  // menu closes, or the name field loses it at once.
  const renameChosen = useRef(false)
  const finalFocus = () => {
    const keep = !renameChosen.current
    renameChosen.current = false
    return keep
  }
  const rename = () => {
    renameChosen.current = true
    onRename()
  }

  if (renaming) {
    return (
      <li>
        <RenameField canvas={canvas} onDone={onRenamed} />
      </li>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger render={<li className="group/row relative" />}>
        <button
          type="button"
          aria-current={current || undefined}
          onClick={() => openCanvas(canvas.id)}
          onDoubleClick={onRename}
          className={cn(
            "flex h-8 w-full items-center gap-2 rounded-md pr-9 pl-2 text-left text-xs transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            current
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          )}
        >
          <span className="min-w-0 flex-1 truncate">{canvas.name}</span>
        </button>
        {/* The count gives way to the menu button on hover and keyboard focus; touch always shows the button. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground tabular-nums group-hover/row:opacity-0 group-has-[:focus-visible]/row:opacity-0 group-has-data-popup-open/row:opacity-0 pointer-coarse:opacity-0"
        >
          {count}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`「${canvas.name}」的更多操作`}
                // Grown to the row's full 32px height to tap, without reaching the rows around it.
                className="absolute top-1 right-1 opacity-0 group-hover/row:opacity-100 group-has-[:focus-visible]/row:opacity-100 before:absolute before:-inset-[5px] data-popup-open:opacity-100 pointer-coarse:opacity-100"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32" finalFocus={finalFocus}>
            <DropdownMenuItem onClick={rename}>重命名</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!deletable} onClick={onDelete}>
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-32" finalFocus={finalFocus}>
        <ContextMenuItem onClick={rename}>重命名</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" disabled={!deletable} onClick={onDelete}>
          删除
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

/** The canvases, above the layer list: pick one to see its diagrams. */
export function CanvasList() {
  const canvases = useCanvasStore((s) => s.canvases)
  const currentId = useCanvasStore((s) => s.currentCanvasId)
  const open = useCanvasStore((s) => s.canvasListOpen)
  const setOpen = useCanvasStore((s) => s.setCanvasListOpen)
  const storedHeight = useCanvasStore((s) => s.canvasListHeight)
  const setHeight = useCanvasStore((s) => s.setCanvasListHeight)
  const windowHeight = useCanvasStore((s) => s.canvasSize.height) || window.innerHeight
  const counts = useCanvasStore(
    useShallow((s) => {
      const counts: Record<string, number> = {}
      for (const d of s.diagrams) counts[d.canvasId] = (counts[d.canvasId] ?? 0) + 1
      return counts
    })
  )
  const [renamingId, setRenamingId] = useState<string | null>(null)
  // Kept after the dialog closes so its words don't blank out while it fades.
  const [confirming, setConfirming] = useState<Canvas | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const current = canvases.find((c) => c.id === currentId)

  const requestDelete = (canvas: Canvas) => {
    // Nothing is lost with an empty canvas; undo still covers a slip.
    if (!counts[canvas.id]) {
      deleteCanvas(canvas.id)
      return
    }
    setConfirming(canvas)
    setConfirmOpen(true)
  }

  // Never taller than all the rows, so dragging down doesn't open a gap.
  const maxHeight = Math.max(ROW, Math.min(rowsHeight(canvases.length), windowHeight * MAX_SHARE))
  const autoRows = Math.min(canvases.length, canvases.length > VISIBLE_ROWS ? VISIBLE_ROWS + 0.5 : VISIBLE_ROWS)
  const height = Math.min(maxHeight, Math.max(ROW, storedHeight ?? rowsHeight(autoRows)))

  return (
    <section aria-label="画布" className="relative flex shrink-0 flex-col border-b pb-2">
      {/* Label on the same 16px edge as the layers heading below. */}
      <div className="flex items-center gap-1 pt-3 pr-3 pb-1 pl-3">
        <button
          type="button"
          aria-expanded={open}
          aria-controls="canvas-list"
          onClick={() => setOpen(!open)}
          className="flex h-7 min-w-0 items-center gap-1 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="shrink-0">画布</span>
          {/* Collapsed, the header still says where you are. */}
          {!open && current && <span className="min-w-0 truncate font-normal text-foreground">· {current.name}</span>}
          <ChevronRight
            aria-hidden
            className={cn("size-3.5 shrink-0 transition-transform duration-150 ease-out-quint", open && "rotate-90")}
          />
        </button>
        <div className="flex-1" />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="新建画布"
                // 28px button, 36px to hit; the inset counts from inside its 1px border.
                className="relative before:absolute before:-inset-[5px]"
                onClick={() => {
                  setOpen(true)
                  setRenamingId(createCanvas())
                }}
              />
            }
          >
            <Plus />
          </TooltipTrigger>
          <TooltipContent>新建画布</TooltipContent>
        </Tooltip>
      </div>

      {open && (
        <ScrollArea id="canvas-list" style={{ height }}>
          <ul className="flex flex-col gap-px px-3">
            {canvases.map((canvas) => (
              <CanvasRow
                key={canvas.id}
                canvas={canvas}
                count={counts[canvas.id] ?? 0}
                current={canvas.id === currentId}
                deletable={canvases.length > 1}
                renaming={canvas.id === renamingId}
                onRename={() => setRenamingId(canvas.id)}
                onRenamed={() => setRenamingId(null)}
                onDelete={() => requestDelete(canvas)}
              />
            ))}
          </ul>
        </ScrollArea>
      )}
      {open && (
        <ListResizeHandle height={height} max={maxHeight} onResize={setHeight} onReset={() => setHeight(null)} />
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>删除画布「{confirming?.name}」？</AlertDialogTitle>
            <AlertDialogDescription>
              其中的 {confirming ? (counts[confirming.id] ?? 0) : 0} 张图表会一起删除。删除后可以在提示中撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirming) deleteCanvas(confirming.id)
                setConfirmOpen(false)
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
