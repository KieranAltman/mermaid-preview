# Mermaid Preview — logo

**Branch Tail.** A decision node splits into two branches that flare into a mermaid's tail: one sign for both halves of
the name, the diagram and the mermaid. Black, graphite and silver separate the parts (the node, one branch, the other
branch), and the order of contrast stays the same on dark backgrounds.

## Files

| Use | File |
|---|---|
| Main logo (horizontal) | `mermaid-preview-horizontal.svg` · on dark: `-horizontal-reversed.svg` |
| Stacked (square spaces, splash, stickers) | `mermaid-preview-stacked.svg` · `-stacked-reversed.svg` |
| Symbol, 40 px and up | `mermaid-preview-symbol.svg` · `-symbol-reversed.svg` |
| Symbol, 16–32 px | `mermaid-preview-symbol-small.svg` · `-symbol-small-reversed.svg` |
| Wordmark alone | `mermaid-preview-wordmark.svg` · `-wordmark-reversed.svg` |
| App icon | `mermaid-preview-app-icon.svg` (rounded tile) · `symbol/icon-tile.svg` (full bleed, the OS rounds it) |
| One colour | `symbol/*-black.svg` · `symbol/*-white.svg` · `horizontal/` · `stacked/` |
| Web / PWA icons | `symbol/favicon.svg` (follows light/dark), `favicon.ico`, `favicon-16/32/48.png`, `apple-touch-icon.png`, `icon-192/512.png`, `maskable-512.png`, `site.webmanifest`, `head-snippet.html` |
| PNGs | `png/` (2400 px wide lockups, 1024 px symbols) and the `-64/256/1024` PNGs next to each variant |
| Presentation | `presentation/board.html` · `presentation/slides/` |
| Source | `source/build_brand.py` rebuilds every master above from the geometry and Geist |

## Clear space

Keep a clear zone of **one diamond-half** on all sides: the distance from the diamond's centre to its corner (about 1/5
of the symbol's height). It scales with the logo. In the horizontal lockup the gap between symbol and wordmark is fixed;
don't change it.

## Minimum size

| Version | Screen | Print |
|---|---|---|
| Horizontal | 160 px wide | 35 mm wide |
| Stacked | 72 px wide | 18 mm wide |
| Symbol (main cut) | 40 px | 10 mm |
| Symbol (small cut) | 16 px | 5 mm |

Below 40 px always use the small cut: a bigger node, thicker branches, wider gaps and a darker light grey.

## Colour

| Name | Role | HEX | RGB | CMYK (K only) | Closest Pantone |
|---|---|---|---|---|---|
| Ink | node, "Mermaid", tiles | `#111111` | 17 17 17 | 0 0 0 93 | Black 6 C |
| Graphite | left branch, "Preview" | `#6E6E6E` | 110 110 110 | 0 0 0 57 | Cool Gray 9 C |
| Silver | right branch | `#BDBDBD` | 189 189 189 | 0 0 0 26 | Cool Gray 4 C |
| Ash | right branch in the small cut; left branch on dark; "Preview" on dark | `#A3A3A3` | 163 163 163 | 0 0 0 36 | Cool Gray 6 C |
| Slate | right branch on dark | `#5C5C5C` | 92 92 92 | 0 0 0 64 | Cool Gray 10 C |
| Paper | background; node on dark | `#FFFFFF` | 255 255 255 | 0 0 0 0 | — |

The Pantone matches are approximate; check them against a swatch book before printing. Silver on white is 1.9:1 and
Slate on Ink is 2.8:1. That's fine for a logo, but don't use those pairs for text.

**Approved pairings:** full tones on white or very light grey · reversed tones on Ink or very dark grey · all black on
white · all white on Ink or a photo's calm, dark area. Never put the full-tone version on mid greys, where Graphite and
Silver disappear.

## Typography

The wordmark is **Geist SemiBold (600)**, outlined, with tracking of −0.012 em. "Mermaid" is Ink and "Preview" is
Graphite, the same steps as the symbol. Geist is licensed under the SIL Open Font License, which allows logo use. The
product UI uses Geist too, so the brand and the app read as one.

## Don't

Stretch, squash or rotate it · recolour outside these greys, or put colour on it · swap the order of the greys · add
shadows, outlines, gradients or effects · rearrange or resize the parts of a lockup · retype the wordmark instead of
using the file · use the main cut below 40 px.

## Handover notes

- **Tested:** 16–1024 px, one colour (black and white), reversed, a squint/blur check, and favicon / app icon / README /
  terminal mockups (`presentation/slides/slide-04.png`). The SVG audit scored 99–100 and found no live text, strokes,
  rasters or filters.
- **Not done:** the reversed version isn't thinned for irradiation; the difference is small at these weights. No
  PDF/EPS (no vector print tools here); the SVGs open in Illustrator and Figma. No trademark search: run one before
  registering or printing at scale.
- **Not yet in the app:** the header logo, `src/app/favicon.ico` and metadata icons still show the old mark.
