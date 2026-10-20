"use client"

import { useTheme } from "next-themes"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useCanvasStore } from "@/lib/store"
import { diagramThemes, type DiagramTheme } from "@/lib/themes"

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
    <div className="flex flex-col gap-2.5">
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
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  )
}

function SwitchField({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function AppearanceSettings() {
  const settings = useCanvasStore((s) => s.settings)
  const updateSettings = useCanvasStore((s) => s.updateSettings)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diagram-theme">配色</Label>
        <Select value={settings.themeId} onValueChange={(themeId) => updateSettings({ themeId })}>
          <SelectTrigger id="diagram-theme" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {diagramThemes.map((theme) => (
              <SelectItem key={theme.id} value={theme.id}>
                <Swatch theme={theme} />
                {theme.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
    <div className="flex flex-col gap-4">
      <SwitchField
        id="show-grid"
        label="显示网格"
        description="在画布背景上显示点阵"
        checked={showGrid}
        onChange={(showGrid) => updateSettings({ showGrid })}
      />
      <SwitchField
        id="snap-to-grid"
        label="吸附到网格"
        description="拖动时按 24 px 对齐位置"
        checked={snapToGrid}
        onChange={(snapToGrid) => updateSettings({ snapToGrid })}
      />
    </div>
  )
}
