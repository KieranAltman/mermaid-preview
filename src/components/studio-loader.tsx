"use client"

import dynamic from "next/dynamic"

// The canvas lives in localStorage and Pele measures text with a browser
// canvas, so there's nothing meaningful to render on the server.
const Studio = dynamic(() => import("@/components/studio"), {
  ssr: false,
  loading: () => <div className="h-dvh bg-canvas" />,
})

export function StudioLoader() {
  return <Studio />
}
