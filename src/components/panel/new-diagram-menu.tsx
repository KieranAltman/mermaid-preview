"use client"

import { ChevronDown, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
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
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant}>
          <Plus data-icon="inline-start" />
          新建图表
          <ChevronDown data-icon="inline-end" className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuLabel>从模板新建</DropdownMenuLabel>
        {templates.map((template) => (
          <DropdownMenuItem
            key={template.id}
            onSelect={() => addDiagram({ code: template.code, title: template.label })}
          >
            {template.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
