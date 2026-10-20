"use client"

import { useEffect, useLayoutEffect, useState } from "react"

import { Canvas } from "@/components/canvas/canvas"
import { InspectorPanel } from "@/components/panel/inspector-panel"
import { LayersPanel } from "@/components/panel/layers-panel"
import { PanelToggle } from "@/components/panel/panel-toggle"
import { DESKTOP_QUERY, PANEL_WIDTH, useCanvasStore } from "@/lib/store"

function isFirstVisit() {
  try {
    return localStorage.getItem("mermaid-canvas") === null
  } catch {
    return false
  }
}

export default function Studio() {
  const panels = useCanvasStore((s) => s.panels)
  // Panel motion stays off until after the first paint, so nothing slides in on load.
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const store = useCanvasStore.getState()
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      // Both panels together would cover a phone screen; start with the canvas.
      store.setPanel("layers", false)
      store.setPanel("inspector", false)
    } else if (isFirstVisit() && store.panels.layers) {
      // The canvas runs under the docked layers panel; start the camera beside it.
      store.setViewport({ ...store.viewport, x: PANEL_WIDTH.layers })
    }
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
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
    <div
      className="studio group/studio relative h-dvh overflow-hidden"
      data-ready={ready}
      data-layers={panels.layers ? "open" : "closed"}
      data-inspector={panels.inspector ? "open" : "closed"}
    >
      <PanelToggle side="layers" />
      <LayersPanel />
      <Canvas />
      <PanelToggle side="inspector" />
      <InspectorPanel />
    </div>
  )
}
