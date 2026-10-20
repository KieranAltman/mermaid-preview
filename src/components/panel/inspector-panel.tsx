"use client"

import { Trash2 } from "lucide-react"

import { DiagramEditor } from "@/components/panel/diagram-editor"
import { Panel, PanelToggleSlot, Section } from "@/components/panel/panel-chrome"
import { AppearanceSettings, CanvasSettings } from "@/components/panel/settings-section"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { ScrollArea } from "@/components/ui/scroll-area"
import { deleteDiagrams } from "@/lib/actions"
import { modKey } from "@/lib/platform"
import { useCanvasStore } from "@/lib/store"

function MultiSelection({ ids }: { ids: string[] }) {
  const setSelection = useCanvasStore((s) => s.setSelection)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        已选择 <span className="tabular-nums">{ids.length}</span> 张图表。拖动其中任意一张可整体移动。
      </p>
      <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <Kbd>⇧</Kbd> + 点击，加入或移出选择
        </li>
        <li className="flex items-center gap-1.5">
          <Kbd>{modKey}</Kbd>
          <Kbd>A</Kbd> 全选，<Kbd>Esc</Kbd> 取消选择
        </li>
      </ul>
      <div className="flex items-center gap-1">
        <Button variant="outline" onClick={() => setSelection([])}>
          取消选择
        </Button>
        <div className="flex-1" />
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => deleteDiagrams(ids)}
        >
          <Trash2 data-icon="inline-start" />
          删除所选
        </Button>
      </div>
    </div>
  )
}

export function InspectorPanel() {
  const selected = useCanvasStore((s) => s.diagrams.find((d) => d.id === s.selectedId))
  const selectedIds = useCanvasStore((s) => s.selectedIds)
  const multiple = selectedIds.length > 1
  const open = useCanvasStore((s) => s.panels.inspector)

  return (
    <Panel side="right" label="属性" open={open}>
      {/* pl-2 puts the icon (inset 8px in its 32px button) on the content's
          16px edge, mirroring the layers panel's collapse button on the right. */}
      <header className="flex h-12 shrink-0 items-center gap-1 border-b pr-4 pl-2">
        <PanelToggleSlot />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {multiple ? `已选择 ${selectedIds.length} 张图表` : selected ? selected.title || "未命名图表" : "属性"}
        </h2>
      </header>

      <ScrollArea className="min-h-0 flex-1">
        <Section title="编辑">
          {multiple ? (
            <MultiSelection ids={selectedIds} />
          ) : selected ? (
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
