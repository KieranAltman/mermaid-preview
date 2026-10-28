# Canvases are separate surfaces, like Figma pages

Users wanted to sort diagrams into groups. A group is a canvas: a named,
separate infinite surface with its own diagrams and its own pan and zoom, and
only the current canvas is shown. Every diagram belongs to exactly one canvas;
new diagrams go into the current one. A user with no canvases gets a default
canvas, which is otherwise ordinary: it can be renamed, and deleted as long as
another canvas remains. Existing data moves into the default canvas
unchanged. The product is renamed Mermaid Preview, since "Mermaid 画布" now
names one canvas, not the app.

## Considered options

- **Sections on one canvas** (Figma sections) — a titled frame that holds and
  moves its diagrams. Keeps everything in view, but unrelated work still
  shares one surface, and frames bring their own drawing, resizing and
  membership-by-position rules.
- **Folders in the layer list only** — cheapest, but the list and the canvas
  disagree: a folder says "together" while its diagrams sit anywhere.
- **Logical groups** (⌘G) — select and move as one, with no visible frame.
  Organizes the selection, not the work.
- **Ungrouped diagrams allowed** — rejected: every diagram has a canvas, so
  "where does this go" never has two answers.

## Consequences

- The viewport is per canvas; selection is cleared on switch. Appearance
  settings, panel state and panel widths stay global.
- Deleting a non-empty canvas asks first and still offers undo; the last
  canvas can't be deleted.
- Undoing a deletion restores into the original canvas and switches to it,
  so the undo is visible.
- The localStorage key stays `mermaid-canvas` so existing data still loads.
- Canvases can be reordered: press and hold a row, then drag it, or use 上移 /
  下移 in its menu. The default canvas stays first and can't be moved. Once
  it's deleted, every canvas can move; undo puts it back on top.

## Not in the first version

Duplicating a canvas, shortcuts for switching, searching across canvases,
and syncing canvases between browser tabs.
