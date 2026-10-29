export type PeleVars = {
  "--pele-bg": string
  "--pele-fg": string
  "--pele-muted": string
  "--pele-line": string
  "--pele-surface": string
  "--pele-surface-alt": string
  "--pele-border": string
  "--pele-accent": string
  "--pele-critical": string
  // Charts color their series (timeline periods, pie slices, Git branches…) from these, in order.
  "--pele-series-1": string
  "--pele-series-2": string
  "--pele-series-3": string
  "--pele-series-4": string
  "--pele-series-5": string
  "--pele-series-6": string
  "--pele-series-7": string
  "--pele-series-8": string
}

export type DiagramTheme = {
  id: string
  label: string
  light: PeleVars
  dark: PeleVars
}

// Series colors share one lightness per mode, each at a fixed share of its hue's sRGB chroma
// ceiling (OKLCH), so none jumps out. Neutral keeps to cool hues (slate blue, teal, lavender;
// docs/decisions/series-palette.md); blueprint and forest lean to their own hues; Flexoki uses
// its own accents, a step darker or lighter where a label needed it. Light series keep a
// white label at 4.5:1 or better, dark ones a dark label.
export const diagramThemes: DiagramTheme[] = [
  {
    id: "neutral",
    label: "中性",
    light: {
      "--pele-bg": "#ffffff",
      "--pele-fg": "#1c1d21",
      "--pele-muted": "#6b6e76",
      "--pele-line": "#45474d",
      "--pele-surface": "#f4f5f7",
      "--pele-surface-alt": "#eaebee",
      "--pele-border": "#b9bcc3",
      "--pele-accent": "#3b6fd8",
      "--pele-critical": "#d64545",
      "--pele-series-1": "#4f6c8a",
      "--pele-series-2": "#51706f",
      "--pele-series-3": "#635ea7",
      "--pele-series-4": "#517165",
      "--pele-series-5": "#506e7c",
      "--pele-series-6": "#7b5696",
      "--pele-series-7": "#516f74",
      "--pele-series-8": "#4a66a6",
    },
    dark: {
      "--pele-bg": "#1b1c1f",
      "--pele-fg": "#e6e7ea",
      "--pele-muted": "#9a9da5",
      "--pele-line": "#b4b7be",
      "--pele-surface": "#26272b",
      "--pele-surface-alt": "#2f3035",
      "--pele-border": "#4a4c53",
      "--pele-accent": "#7096e0",
      "--pele-critical": "#d86a6a",
      "--pele-series-1": "#9db7d3",
      "--pele-series-2": "#8dbfbe",
      "--pele-series-3": "#b0b0d3",
      "--pele-series-4": "#8dc1ae",
      "--pele-series-5": "#8ebcd3",
      "--pele-series-6": "#c1aad3",
      "--pele-series-7": "#8dbec7",
      "--pele-series-8": "#a6b4d3",
    },
  },
  {
    id: "flexoki",
    label: "Flexoki",
    light: {
      "--pele-bg": "#fffcf0",
      "--pele-fg": "#100f0f",
      "--pele-muted": "#6f6e69",
      "--pele-line": "#100f0f",
      "--pele-surface": "#f2f0e5",
      "--pele-surface-alt": "#e6e4d9",
      "--pele-border": "#cecdc3",
      "--pele-accent": "#205ea6",
      "--pele-critical": "#af3029",
      "--pele-series-1": "#205ea6",
      "--pele-series-2": "#bc5215",
      "--pele-series-3": "#536907",
      "--pele-series-4": "#a02f6f",
      "--pele-series-5": "#1c6c66",
      "--pele-series-6": "#8e6b01",
      "--pele-series-7": "#5e409d",
      "--pele-series-8": "#af3029",
    },
    dark: {
      "--pele-bg": "#100f0f",
      "--pele-fg": "#cecdc3",
      "--pele-muted": "#878580",
      "--pele-line": "#cecdc3",
      "--pele-surface": "#1c1b1a",
      "--pele-surface-alt": "#282726",
      "--pele-border": "#403e3c",
      "--pele-accent": "#4385be",
      "--pele-critical": "#d14d41",
      "--pele-series-1": "#4385be",
      "--pele-series-2": "#da702c",
      "--pele-series-3": "#879a39",
      "--pele-series-4": "#ce5d97",
      "--pele-series-5": "#3aa99f",
      "--pele-series-6": "#d0a215",
      "--pele-series-7": "#8b7ec8",
      "--pele-series-8": "#e8705f",
    },
  },
  {
    id: "blueprint",
    label: "蓝图",
    light: {
      "--pele-bg": "#f5f8fd",
      "--pele-fg": "#16253f",
      "--pele-muted": "#5a6a85",
      "--pele-line": "#2f5ba8",
      "--pele-surface": "#e4ecf9",
      "--pele-surface-alt": "#d5e1f5",
      "--pele-border": "#8aa6d6",
      "--pele-accent": "#2f5ba8",
      "--pele-critical": "#c2413b",
      "--pele-series-1": "#516b8c",
      "--pele-series-2": "#547068",
      "--pele-series-3": "#725b9a",
      "--pele-series-4": "#81614f",
      "--pele-series-5": "#536e77",
      "--pele-series-6": "#5b7050",
      "--pele-series-7": "#855680",
      "--pele-series-8": "#736850",
    },
    dark: {
      "--pele-bg": "#121a2a",
      "--pele-fg": "#d6e1f5",
      "--pele-muted": "#8796b3",
      "--pele-line": "#7ea2dc",
      "--pele-surface": "#1b2840",
      "--pele-surface-alt": "#22324f",
      "--pele-border": "#3b5480",
      "--pele-accent": "#7ea2dc",
      "--pele-critical": "#d97570",
      "--pele-series-1": "#9eb3ce",
      "--pele-series-2": "#8fbcaf",
      "--pele-series-3": "#b6aace",
      "--pele-series-4": "#d0a791",
      "--pele-series-5": "#8eb9c7",
      "--pele-series-6": "#9bbd8a",
      "--pele-series-7": "#d09ecb",
      "--pele-series-8": "#c2af89",
    },
  },
  {
    id: "forest",
    label: "森林",
    light: {
      "--pele-bg": "#fbfcf8",
      "--pele-fg": "#1d261d",
      "--pele-muted": "#636d60",
      "--pele-line": "#3d5a3a",
      "--pele-surface": "#edf2e6",
      "--pele-surface-alt": "#e0e8d6",
      "--pele-border": "#a6b89b",
      "--pele-accent": "#4b7a3f",
      "--pele-critical": "#b5452f",
      "--pele-series-1": "#54734d",
      "--pele-series-2": "#83604c",
      "--pele-series-3": "#516f74",
      "--pele-series-4": "#935459",
      "--pele-series-5": "#6e6a4d",
      "--pele-series-6": "#82558c",
      "--pele-series-7": "#517168",
      "--pele-series-8": "#7a654d",
    },
    dark: {
      "--pele-bg": "#151a15",
      "--pele-fg": "#dbe3d5",
      "--pele-muted": "#909c8b",
      "--pele-line": "#a3bb98",
      "--pele-surface": "#1f271e",
      "--pele-surface-alt": "#283226",
      "--pele-border": "#435140",
      "--pele-accent": "#8fb87f",
      "--pele-critical": "#d77b66",
      "--pele-series-1": "#90c185",
      "--pele-series-2": "#d3a68e",
      "--pele-series-3": "#8abbc4",
      "--pele-series-4": "#d3a3a5",
      "--pele-series-5": "#bab384",
      "--pele-series-6": "#c8a1d1",
      "--pele-series-7": "#8bbdaf",
      "--pele-series-8": "#cdaa84",
    },
  },
]

export function getDiagramTheme(id: string) {
  return diagramThemes.find((theme) => theme.id === id) ?? diagramThemes[0]
}
