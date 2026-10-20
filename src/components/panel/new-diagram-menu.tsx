"use client"

import { ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCanvasStore } from "@/lib/store"
import { templates } from "@/lib/templates"

export function NewDiagramMenu({
  size = "default",
  variant = "default",
}: {
  size?: "default" | "sm"
  variant?: "default" | "outline"
}) {
  const addDiagram = useCanvasStore((s) => s.addDiagram)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button size={size} variant={variant} />}>
        <Plus data-icon="inline-start" />
        新建图表
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {/* Base UI's group label only works inside a group. */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>从模板新建</DropdownMenuLabel>
          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => addDiagram({ code: template.code, title: template.label })}
            >
              {template.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
