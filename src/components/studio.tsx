"use client"

import { useEffect, useLayoutEffect } from "react"

import { Canvas } from "@/components/canvas/canvas"
import { InspectorPanel } from "@/components/panel/inspector-panel"
import { LayersPanel } from "@/components/panel/layers-panel"
import { useCanvasStore } from "@/lib/store"

export default function Studio() {
  const panels = useCanvasStore((s) => s.panels)

  useLayoutEffect(() => {
    // Both panels together would cover a phone screen; start with the canvas.
    if (window.matchMedia("(max-width: 767px)").matches) {
      const { setPanel } = useCanvasStore.getState()
      setPanel("layers", false)
      setPanel("inspector", false)
    }
  }, [])

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement)
    const sans = styles.getPropertyValue("--app-font").trim() || "sans-serif"
    const mono = styles.getPropertyValue("--app-font-mono").trim() || "monospace"
    // Pele sizes nodes from measured text, so wait for the web fonts first.
    Promise.all([
      document.fonts.load(`16px ${sans}`),
      document.fonts.load(`bold 16px ${sans}`),
      document.fonts.load(`16px ${mono}`),
    ])
      .catch(() => undefined)
      .then(() => useCanvasStore.getState().setFonts({ sans, mono }))
  }, [])

  return (
    <div className="relative flex h-dvh overflow-hidden">
      {panels.layers && <LayersPanel />}
      <Canvas />
      {panels.inspector && <InspectorPanel />}
    </div>
  )
}
