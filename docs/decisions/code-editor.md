# Code editor — decided from /proto/code-editor

The inline textarea in the inspector grew with the code (`field-sizing: content`):
a 31-line diagram pushed the inspector to 1580px and buried the appearance and
canvas settings. The inspector stays 320px wide, so the editor moved out of it.

## Decision: bottom dock

- A non-modal editor docked to the bottom of the canvas, spanning the area
  between the docked side panels. Edits apply live to the card above it.
- Same surface as the side panels: square corners, `bg-sidebar`, one `border-t`
  against the canvas, no lift shadow. Header 48px with a bottom rule; the close
  icon sits 16px from the edge, like the panel toggles.
- Code area runs edge to edge under the header: no padding, border or radius.
  It uses the recessed `--field` layer, which is what separates it from the
  header. Focus is shown by the caret, as in a code editor, not by a ring.
- Line-number gutter; long lines scroll (`wrap="off"`) instead of wrapping.
  The error line's number turns red; the header shows the reason.
- Slides on `translate` with the drawer recipe: 300ms in, 200ms out,
  `--ease-drawer`. Inert while closed. Resizable from a top handle
  (drag, or ↑/↓ on the focused handle), 160px to 70% of the window.
- Opens from the inspector's code preview or with Enter on a selected card.
  Esc closes it and returns focus. (Double-clicking a card first opened it;
  that gesture now centers and fits the card instead.)
- The inspector keeps a compact preview of the first lines (852px instead of
  1580px for the same diagram).

## Rejected

- **Inline (status quo)** — the inspector grows with the code; long diagrams
  push every other setting off screen.
- **Dialog** — a focused draft with a side-by-side preview and explicit apply.
  Good for large rewrites, but it hides the canvas while editing, and closing
  with unapplied edits needs a confirmation step. Most edits here are small and
  want the real card as feedback.
- **Attached to the card** — the editor follows the selected card through pan,
  zoom and drag. With both panels docked the free area (864px at 1440px wide)
  usually can't fit a 384px editor beside the card, so it ends up covering the
  card or its neighbors.
