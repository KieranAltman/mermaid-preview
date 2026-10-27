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
  for danger), so the row height never changes. Hovering it (150ms in, 200ms
  out), clicking, Enter or a tap opens a bubble styled like the app tooltip
  with the explanation and an "导出备份" link that downloads the saved canvas
  as JSON. It is a hover-opening popover, not a tooltip, because a tooltip
  closes before the pointer reaches the button.
- The icon is labeled ("存储空间快满了，查看说明"); a visually hidden live
  region announces the level text when it changes.
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
