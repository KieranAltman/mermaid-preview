"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { CanvasList } from "@/components/panel/canvas-list"
import { DiagramList } from "@/components/panel/diagram-list"
import { LayerDragGhost } from "@/components/panel/layer-drag"
import { NewDiagramMenu } from "@/components/panel/new-diagram-menu"
import { Panel, PanelToggleSlot } from "@/components/panel/panel-chrome"
import { StorageUsage } from "@/components/panel/storage-usage"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { currentDiagrams, useCanvasStore } from "@/lib/store"

function ThemeMenu() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  return (
    <DropdownMenu>
      <Tooltip>
        {/* One button is both the tooltip trigger and the menu trigger. */}
        <TooltipTrigger
          render={
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="切换界面主题" />} />
          }
        >
          {resolvedTheme === "dark" ? <Moon /> : <Sun />}
        </TooltipTrigger>
        <TooltipContent>界面主题</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun />
            浅色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon />
            深色
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor />
            跟随系统
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** The Branch Tail mark in its small cut (brand/mermaid-preview-symbol-small.svg), drawn for 16–32 px. */
function Logo() {
  return (
    <svg viewBox="0 0 256 256" className="size-6 shrink-0" aria-hidden>
      <path
        className="fill-(--logo-node)"
        d="M136.49 17.51 L178.49 59.51 A12 12 0 0 1 178.49 76.49 L136.49 118.49 A12 12 0 0 1 119.51 118.49 L77.51 76.49 A12 12 0 0 1 77.51 59.51 L119.51 17.51 A12 12 0 0 1 136.49 17.51 Z"
      />
      <path
        className="fill-(--logo-left)"
        d="M110 132 H117 Q122 132 122 137 V206 Q122 214 114 218 C90 230 46 228 14 202 Q5 194 17 193 C62 190 99 176 105 138 Q106 132 110 132 Z"
      />
      <path
        className="fill-(--logo-right)"
        d="M146 132 H139 Q134 132 134 137 V206 Q134 214 142 218 C166 230 210 228 242 202 Q251 194 239 193 C194 190 157 176 151 138 Q150 132 146 132 Z"
      />
    </svg>
  )
}

export function LayersPanel() {
  const count = useCanvasStore((s) => currentDiagrams(s).length)
  const open = useCanvasStore((s) => s.panels.layers)

  return (
    <Panel side="left" label="图层" open={open}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <Logo />
        {/* Set like the wordmark: "Preview" a step lighter. */}
        <h1 className="flex-1 truncate text-sm font-semibold">
          Mermaid <span className="text-(--logo-left)">Preview</span>
        </h1>
        <ThemeMenu />
        <PanelToggleSlot />
      </header>

      <CanvasList />

      {/* Laid out like the canvas heading, so the two plus buttons line up. */}
      <div className="flex shrink-0 items-center gap-1 pt-3 pr-3 pb-1 pl-4">
        <h2 className="flex-1 text-xs font-medium text-muted-foreground">
          图层 <span className="tabular-nums">· {count}</span>
        </h2>
        <NewDiagramMenu compact />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-3">
          <DiagramList />
        </div>
      </ScrollArea>

      <StorageUsage />
      <LayerDragGhost />

      <footer className="shrink-0 border-t px-4 py-2.5 text-xs text-muted-foreground">
        由{" "}
        <a
          href="https://pele.run"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground"
        >
          Pele
        </a>{" "}
        渲染 · 自动保存在本机
      </footer>
    </Panel>
  )
}
