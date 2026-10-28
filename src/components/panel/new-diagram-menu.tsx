"use client"

import { ChevronDown, Plus } from "lucide-react"

import { DiagramTypeIcon } from "@/components/icons/diagram-icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useCanvasStore } from "@/lib/store"
import { revealDiagram } from "@/lib/viewport"
import { templates } from "@/lib/templates"

export function NewDiagramMenu({
  size = "default",
  variant = "default",
  compact = false,
}: {
  size?: "default" | "sm"
  variant?: "default" | "outline"
  // A bare plus, like the "new canvas" button above it.
  compact?: boolean
}) {
  const addDiagram = useCanvasStore((s) => s.addDiagram)

  return (
    <DropdownMenu>
      {compact ? (
        <Tooltip>
          {/* One button is both the tooltip trigger and the menu trigger. */}
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="新建图表"
                    // 28px button, 36px to hit, like the "new canvas" button.
                    className="relative before:absolute before:-inset-[5px]"
                  />
                }
              />
            }
          >
            <Plus />
          </TooltipTrigger>
          <TooltipContent>新建图表</TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger render={<Button size={size} variant={variant} />}>
          <Plus data-icon="inline-start" />
          新建图表
          <ChevronDown data-icon="inline-end" className="opacity-60" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={compact ? "end" : "start"} className="w-44">
        {/* Base UI's group label only works inside a group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>从模板新建</DropdownMenuLabel>
          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => revealDiagram(addDiagram({ code: template.code, title: template.label }))}
            >
              <DiagramTypeIcon type={template.id} />
              {template.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
