"use client"

import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react"

import { followPanelMotion } from "@/components/panel/panel-chrome"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCanvasStore, type PanelSide } from "@/lib/store"
import { cn } from "@/lib/utils"

const copy = {
  layers: { open: "收起图层面板", closed: "展开图层面板" },
  inspector: { open: "收起属性面板", closed: "展开属性面板" },
}

// Both icons stay mounted and cross-fade, so the swap animates both ways.
const iconSwap = "absolute inset-0 transition-[opacity,scale,filter] duration-300 ease-swap"
const iconHidden = "scale-30 opacity-0 blur-[3px]"

/**
 * One button per panel that travels between the panel header, where it
 * collapses the panel, and the canvas corner, where it brings it back.
 * Being the same element keeps focus on it and lets the move reverse mid-way.
 */
export function PanelToggle({ side }: { side: PanelSide }) {
  const open = useCanvasStore((s) => s.panels[side])
  const setPanel = useCanvasStore((s) => s.setPanel)
  const label = copy[side][open ? "open" : "closed"]
  const [CloseIcon, OpenIcon] =
    side === "layers" ? [PanelLeftClose, PanelLeftOpen] : [PanelRightClose, PanelRightOpen]

  return (
    // The wrapper travels; the button inside keeps its own press feedback,
    // which also uses `translate` and would otherwise fight the move.
    <div
      data-state={open ? "open" : "closed"}
      className={cn(
        "absolute top-0 z-30",
        followPanelMotion,
        // Docked: the header slot (8px inside the panel's 1px border, 8px down).
        // Floating: 12px in from the canvas corner.
        side === "layers"
          ? "left-0 translate-3 data-open:translate-x-[calc(var(--layers-w)-2.5rem-1px)] data-open:translate-y-2"
          : "right-0 -translate-x-3 translate-y-3 data-open:-translate-x-[calc(var(--inspector-w)-2.5rem-1px)] data-open:translate-y-2"
      )}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={label}
              data-state={open ? "open" : "closed"}
              onClick={() => setPanel(side, !open)}
              // Floating on the canvas it needs its own surface; docked it sits on the panel's.
              className="data-closed:bg-background data-closed:shadow-(--frame-shadow) data-closed:hover:bg-muted"
            />
          }
        >
          <span className="relative size-4">
            <CloseIcon className={cn(iconSwap, !open && iconHidden)} />
            <OpenIcon className={cn(iconSwap, open && iconHidden)} />
          </span>
        </TooltipTrigger>
        <TooltipContent side={side === "layers" ? "right" : "left"}>{label}</TooltipContent>
      </Tooltip>
    </div>
  )
}
