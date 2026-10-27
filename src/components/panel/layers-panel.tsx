"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { DiagramList } from "@/components/panel/diagram-list"
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
import { useCanvasStore } from "@/lib/store"

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

function Logo() {
  return (
    <svg viewBox="0 0 20 20" className="size-5 shrink-0 text-foreground" aria-hidden>
      <rect x="1.5" y="2.5" width="7" height="5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="11.5" y="12.5" width="7" height="5" rx="1.5" fill="currentColor" />
      <path d="M5 7.5v3.5a2 2 0 0 0 2 2h4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function LayersPanel() {
  const count = useCanvasStore((s) => s.diagrams.length)
  const open = useCanvasStore((s) => s.panels.layers)

  return (
    <Panel side="left" label="图层" open={open}>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b pr-2 pl-4">
        <Logo />
        <h1 className="flex-1 truncate text-sm font-semibold">Mermaid 画布</h1>
        <ThemeMenu />
        <PanelToggleSlot />
      </header>

      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-4 pb-2">
        <h2 className="text-xs font-medium text-muted-foreground">
          图层 <span className="tabular-nums">· {count}</span>
        </h2>
        <NewDiagramMenu size="sm" variant="outline" />
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-3">
          <DiagramList />
        </div>
      </ScrollArea>

      <StorageUsage />

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
