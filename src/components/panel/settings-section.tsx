"use client"

import { ChevronDown } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useCanvasStore } from "@/lib/store"
import { diagramThemes, getDiagramTheme, type DiagramTheme } from "@/lib/themes"

function Swatch({ theme }: { theme: DiagramTheme }) {
  const { resolvedTheme } = useTheme()
  const vars = resolvedTheme === "dark" ? theme.dark : theme.light
  return (
    <span
      aria-hidden
      className="flex h-4 w-7 shrink-0 items-center justify-center gap-0.5 rounded-sm"
      style={{ background: vars["--pele-bg"], boxShadow: "inset 0 0 0 1px var(--border)" }}
    >
      <span className="size-1.5 rounded-full" style={{ background: vars["--pele-line"] }} />
      <span className="size-1.5 rounded-full" style={{ background: vars["--pele-accent"] }} />
    </span>
  )
}

function SliderField({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label id={`${id}-label`}>{label}</Label>
        <span className="text-xs text-muted-foreground tabular-nums">{value} px</span>
      </div>
      <Slider
        aria-labelledby={`${id}-label`}
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
      />
    </div>
  )
}

function SwitchField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex min-h-5 items-center justify-between gap-4">
      <Label htmlFor={id} className="flex-1">
        {label}
      </Label>
      <Switch id={id} size="sm" checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function AppearanceSettings() {
  const settings = useCanvasStore((s) => s.settings)
  const updateSettings = useCanvasStore((s) => s.updateSettings)
  const theme = getDiagramTheme(settings.themeId)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diagram-theme">配色</Label>
        <DropdownMenu>
          {/* Looks like a field, opens like every other menu in the app. */}
          <DropdownMenuTrigger
            id="diagram-theme"
            className="flex h-7 w-full items-center gap-2 rounded-[min(var(--radius-md),10px)] border border-input bg-field pr-2 pl-2.5 text-xs transition-colors duration-150 outline-none hover:border-foreground/20 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:border-foreground/20"
          >
            <Swatch theme={theme} />
            <span className="min-w-0 flex-1 truncate text-left">{theme.label}</span>
            <ChevronDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup
              value={settings.themeId}
              onValueChange={(themeId: string) => updateSettings({ themeId })}
            >
              {diagramThemes.map((option) => (
                <DropdownMenuRadioItem key={option.id} value={option.id} closeOnClick>
                  <Swatch theme={option} />
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SliderField
        id="font-size"
        label="字号"
        value={settings.fontSize}
        min={12}
        max={24}
        step={1}
        onChange={(fontSize) => updateSettings({ fontSize })}
      />
      <SliderField
        id="padding"
        label="内边距"
        value={settings.padding}
        min={0}
        max={48}
        step={4}
        onChange={(padding) => updateSettings({ padding })}
      />
    </div>
  )
}

export function CanvasSettings() {
  const showGrid = useCanvasStore((s) => s.settings.showGrid)
  const snapToGrid = useCanvasStore((s) => s.settings.snapToGrid)
  const updateSettings = useCanvasStore((s) => s.updateSettings)

  return (
    <div className="flex flex-col gap-3">
      <SwitchField
        id="show-grid"
        label="显示网格"
        checked={showGrid}
        onChange={(showGrid) => updateSettings({ showGrid })}
      />
      <SwitchField
        id="snap-to-grid"
        label="吸附到网格"
        checked={snapToGrid}
        onChange={(snapToGrid) => updateSettings({ snapToGrid })}
      />
    </div>
  )
}
