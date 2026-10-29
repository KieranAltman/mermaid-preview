# Series colors for the neutral theme — decided from /proto/series-palettes

Timelines, pies, Git branches and the other charts color their series from
`--pele-series-1` to `-8`. Unset, Pele falls back to Tableau 10 (blue, orange,
green…): saturated, uneven in lightness, and loud beside an interface that is
black, white and grey.

## Decision: 北欧 (cool hues)

- Slate blue, teal, lavender and their neighbors: hues 250, 195, 285, 170, 230,
  310, 210, 265 in that order, so the first few series sit far apart.
- One lightness per mode in OKLCH (L ≈ 0.52 light, 0.77 dark), each hue at 40%
  of its sRGB chroma ceiling, so no series jumps out.
- Light: `#4f6c8a #51706f #635ea7 #517165 #506e7c #7b5696 #516f74 #4a66a6`
- Dark: `#9db7d3 #8dbfbe #b0b0d3 #8dc1ae #8ebcd3 #c1aad3 #8dbec7 #a6b4d3`
- Timeline headers draw their label in the chart background, so every light
  series keeps white text at 5.4:1 or better and every dark one a dark label at
  8.1:1 or better.
- Stored as hex in `src/lib/themes.ts`, so exported SVGs open in tools that
  don't read `oklch()`.
- Known cost: a few teals are close together, so a pie's later slices are
  harder to tell apart. Picked anyway for being calm and matching the cool
  greys of the interface.

The other themes keep their own series: Flexoki its official accents;
blueprint and forest the same method, leaning to their own hues.

## Rejected

- **雾霭** — hues spread round the whole wheel at the same muted chroma. The
  safest and easiest to tell apart, but no character, and its warm hues sit
  less easily beside the cool greys.
- **墨阶** — greys only, told apart by alternating lightness. Fully in step
  with the interface, but past four series slices become hard to tell apart,
  and charts lose color as a cue entirely.
- **大地** — terracotta, ochre, olive, moss. Warm and editorial, but three
  red-browns only stay apart by sitting far from each other in the order.
- **宝石** — deeper, more saturated jewel tones. The easiest to read and the
  most striking, but it outshouts the quiet interface around it.
