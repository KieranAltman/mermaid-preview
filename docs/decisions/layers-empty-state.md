# Empty layer list — decided from /proto/layers-empty

With several canvases, an empty layer list became common: every new canvas
starts with one. It used to be one line of 14px text pointing at the button
above it.

## Decision: icon, one line, a create button

- In the layer list, centered, 32px from the heading: a 40px recessed tile
  (`bg-field`, hairline ring) with the `Workflow` icon, the line
  "这张画布还没有图表，从一个模板开始。" (12px, muted, balanced), and the
  template menu as an outline "新建图表" button.
- Outline, not filled: the canvas beside it shows its own empty state with
  the filled button, and one view gets one primary action.
- The layer heading's create button is now a bare plus (ghost, 28px, tooltip
  "新建图表") opening the same template menu, matching the canvas heading's
  plus. Both headings share one layout so the two buttons line up.

## Rejected

- **现状** — one line pointing at the header button. Larger than the rows
  around it, and only says where to look.
- **轮廓** — dashed slots in the shape of the list. Quiet, but read as a
  loading skeleton and offered no way forward.
- **模板** — four common templates as rows, one click each. Fastest, but it
  repeats the template menu and the Mermaid keywords crowd a 224px panel.
- **粘贴** — a field that turns pasted Mermaid or a dropped `.mmd` into a
  diagram. Fits people arriving with code, but it's a second editor beside
  the code dock and takes the most room.
- **移入** — lists other canvases' diagrams to move in. Useful while sorting,
  but grows with the other canvases and falls back to plain text when they
  are empty.
