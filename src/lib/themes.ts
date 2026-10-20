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
}

export type DiagramTheme = {
  id: string
  label: string
  light: PeleVars
  dark: PeleVars
}

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
    },
  },
]

export function getDiagramTheme(id: string) {
  return diagramThemes.find((theme) => theme.id === id) ?? diagramThemes[0]
}
