# Storage usage — decided from /proto/storage

The canvas autosaves to localStorage, which browsers cap near 5 MB per site.
Nothing showed how close a canvas was to that limit, and once a save fails
there is no other copy.

## Decision: quiet readout above the layers footer

- One line and a hairline bar between the diagram list and the footer:
  "本地存储" on the left, "1.2 MB / 5 MB" on the right, a 4px bar below.
  Lives in `src/components/panel/storage-usage.tsx`.
- Counts every key on the site (the quota is shared), in characters, against
  5 MB. No API reports the real quota, so it is an estimate. Re-measured
  after store changes and `storage` events, at most every 250ms.
- Levels: warn at 80%, danger at 95%. The figure and bar take the level's
  tone; the bar fill scales on transform (300ms, `--ease-out-quint`).
- Warnings collapse to an icon beside "本地存储" (triangle for warn, octagon
  for danger), so the row height never changes. The explanation now lives in
  the storage dialog below; the hover bubble that held it is gone.
- A visually hidden live region announces the level text when it changes.
- New tokens `--warning` and `--danger` for status text. `--destructive` as
  text on `--field` is 4.3:1, so light-mode danger is a darker step of the
  same hue; every pair clears 4.8:1 on sidebar, field and popover.

## Rejected

- **明细 (breakdown)** — a recessed card with the total, a segmented bar
  (diagram code / canvas and settings / other site data) and the three
  heaviest diagrams, clickable to select and frame them. Answers "what do I
  delete?", but costs ~200px of a panel whose job is the layer list, for a
  number that rarely matters.
- **按需 (disclosure)** — a ring and percent chip in the footer, with the
  breakdown and backup in a popover. Takes no space, but a 16px ring is easy
  to miss as it fills up, and the size in MB is a click away.
- **Quiet with a visible warning line** — the first take on the chosen variant
  showed the warning text and backup link under the bar. It pushed the list
  up by two lines at 80%; the icon keeps the panel stable.

# Storage and export — decided from /proto/storage, round 2

The readout said how full storage was but not what filled it, and the only
way out was a JSON backup behind a warning. With canvases, people want their
diagrams out by canvas.

## Decision: the readout opens a "存储与导出" dialog

- The whole readout is the trigger (hover tint, focus ring). It opens a
  centered dialog, not a popover: exporting is a task, and choosing canvases
  and a format needs the room.
- Top: the total in the level's tone, the percent, and one bar split into a
  slice per canvas, largest first, in fading steps of the same ink. At 80% and
  95% the level's message sits under it.
- A table of every canvas, largest first: checkbox, name (with "当前" on the
  current one), diagram count, size. Then "设置与其他" for the rest. Sizes are
  each canvas's share of the saved JSON, in characters, like the total. All
  canvases start ticked; the header box selects all or none and shows a dash
  when some are ticked. Clicking anywhere on a row ticks it.
- Formats, as a segmented control:
  - **ZIP**: a folder per canvas, a `.mmd` per diagram. Empty canvases keep
    their folder. Names that clash get numbered ("草稿 (2)"), characters a file
    system refuses become "-". Written by a small stored-only ZIP writer
    (`src/lib/zip.ts`), names flagged UTF-8. Archive Utility, Windows and
    Python read the names fine; macOS's command-line `unzip` ignores the flag
    and garbles them.
  - **Markdown**: one `.md`, a `##` per canvas, a `###` and a mermaid code
    block per diagram.
  - **完整备份**: the saved JSON as before. It always holds everything, so the
    checkboxes disable.
- The button says what will happen: "导出全部 16 张图表", "导出 2 张画布 ·
  5 张图表", "导出完整备份". Exporting closes the dialog and confirms in a toast.

## Rejected

- **轻量 (popover)** — the readout opened a popover with the five largest
  canvases, "其余 N 张画布", and one "导出全部图表" button. Lightest touch, but
  no way to export a few canvases or pick a format.
- **展开 (inline)** — the readout unfolded in the panel into every canvas with
  its own download button. Good for tidying while working, but it squeezes the
  layer list and scrolls once there are more than six canvases.
