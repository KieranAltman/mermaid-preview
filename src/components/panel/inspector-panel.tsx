"use client"

import { PanelRightClose } from "lucide-react"

import { DiagramEditor } from "@/components/panel/diagram-editor"
import { Panel, PanelIconButton, Section } from "@/components/panel/panel-chrome"
import { AppearanceSettings, CanvasSettings } from "@/components/panel/settings-section"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCanvasStore } from "@/lib/store"

export function InspectorPanel() {
  const selected = useCanvasStore((s) => s.diagrams.find((d) => d.id === s.selectedId))
  const setPanel = useCanvasStore((s) => s.setPanel)

  return (
    <Panel side="right" label="属性" className="w-80">
      {/* pl-2 puts the icon (inset 8px in its 32px button) on the content's
          16px edge, mirroring the layers panel's collapse button on the right. */}
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-4 pl-2">
        <PanelIconButton label="收起属性面板" onClick={() => setPanel("inspector", false)}>
          <PanelRightClose />
        </PanelIconButton>
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {selected ? selected.title || "未命名图表" : "属性"}
        </h2>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <Section title="编辑">
          {selected ? (
            <DiagramEditor key={selected.id} diagram={selected} />
          ) : (
            <p className="text-sm text-muted-foreground">
              在画布或左侧图层中选择一张图表，即可编辑它的代码。
            </p>
          )}
        </Section>

        <Section title="外观">
          <AppearanceSettings />
        </Section>

        <Section title="画布">
          <CanvasSettings />
        </Section>
      </ScrollArea>
    </Panel>
  )
}
