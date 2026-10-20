// Only rendered client-side (the studio skips SSR), so navigator is available.
export const isApple = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)

export const modKey = isApple ? "⌘" : "Ctrl"
