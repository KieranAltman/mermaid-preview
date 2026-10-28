"""Builds the Mermaid Preview logo masters: symbol, small cut, reversed, wordmark and lockups."""
import io, sys
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
import uharfbuzz as hb

OUT = sys.argv[1]
FONT = sys.argv[2]
INK, GRAPHITE, SILVER, PAPER = "#111111", "#6E6E6E", "#BDBDBD", "#FFFFFF"
# On dark, contrast keeps the same order: the node brightest, the branches stepping down.
REV = {"node": "#FFFFFF", "left": "#A3A3A3", "right": "#5C5C5C"}

DIAMOND = ("M135.78 29.45 L172.55 66.22 A11 11 0 0 1 172.55 81.78 L135.78 118.55 A11 11 0 0 1 120.22 118.55 "
           "L83.45 81.78 A11 11 0 0 1 83.45 66.22 L120.22 29.45 A11 11 0 0 1 135.78 29.45 Z")
LEFT = ("M118 134 H122 Q126 134 126 138 V209 Q126 216 119 219 C95 229 54 225 23 202 Q14 195 25 195 "
        "C68 193 106 175 113 140 Q114 134 118 134 Z")
RIGHT = ("M138 134 H134 Q130 134 130 138 V209 Q130 216 137 219 C161 229 202 225 233 202 Q242 195 231 195 "
         "C188 193 150 175 143 140 Q142 134 138 134 Z")
# Small cut (16–32 px): a bigger node, thicker branches, wider gaps, a darker light grey.
S_DIAMOND = ("M136.49 17.51 L178.49 59.51 A12 12 0 0 1 178.49 76.49 L136.49 118.49 A12 12 0 0 1 119.51 118.49 "
             "L77.51 76.49 A12 12 0 0 1 77.51 59.51 L119.51 17.51 A12 12 0 0 1 136.49 17.51 Z")
S_LEFT = ("M110 132 H117 Q122 132 122 137 V206 Q122 214 114 218 C90 230 46 228 14 202 Q5 194 17 193 "
          "C62 190 99 176 105 138 Q106 132 110 132 Z")
S_RIGHT = ("M146 132 H139 Q134 132 134 137 V206 Q134 214 142 218 C166 230 210 228 242 202 Q251 194 239 193 "
           "C194 190 157 176 151 138 Q150 132 146 132 Z")


def symbol_paths(node, left, right, small=False):
    d, l, r = (S_DIAMOND, S_LEFT, S_RIGHT) if small else (DIAMOND, LEFT, RIGHT)
    return (f'<path fill="{node}" d="{d}"/>\n  <path fill="{left}" d="{l}"/>\n  <path fill="{right}" d="{r}"/>')


def svg(view, body, title, w=None, h=None):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}">\n  <title>{title}</title>\n  {body}\n</svg>\n')


def write(name, text):
    with open(f"{OUT}/{name}", "w") as f:
        f.write(text)


# ---- Symbol masters ----
write("mermaid-preview-symbol.svg", svg("0 0 256 256", symbol_paths(INK, GRAPHITE, SILVER), "Mermaid Preview"))
write("mermaid-preview-symbol-small.svg", svg("0 0 256 256", symbol_paths(INK, GRAPHITE, "#A3A3A3", small=True), "Mermaid Preview"))
write("mermaid-preview-symbol-reversed.svg", svg("0 0 256 256", symbol_paths(REV["node"], REV["left"], REV["right"]), "Mermaid Preview"))
write("mermaid-preview-symbol-small-reversed.svg", svg("0 0 256 256", symbol_paths(REV["node"], "#A3A3A3", "#6E6E6E", small=True), "Mermaid Preview"))

# ---- Wordmark: Geist SemiBold, outlined ----
font = TTFont(FONT)
font = instantiateVariableFont(font, {"wght": 600})
font.flavor = None  # HarfBuzz reads TTF, not WOFF2
buf = io.BytesIO()
font.save(buf)
blob = hb.Blob(buf.getvalue())
face = hb.Face(blob)
hbfont = hb.Font(face)
upem = font["head"].unitsPerEm
cap = font["OS/2"].sCapHeight
glyphset = font.getGlyphSet()
order = font.getGlyphOrder()


def shape(text, size, tracking):
    """Returns ([(path, x_end)], width) for text at `size`, baseline at y=0, tracking in em."""
    b = hb.Buffer()
    b.add_str(text)
    b.guess_segment_properties()
    hb.shape(hbfont, b, {"kern": True, "liga": True})
    scale = size / upem
    x = 0
    paths = []
    for info, pos in zip(b.glyph_infos, b.glyph_positions):
        pen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.2f}".rstrip("0").rstrip("."))
        glyphset[order[info.codepoint]].draw(TransformPen(pen, (scale, 0, 0, -scale, x + pos.x_offset * scale, -pos.y_offset * scale)))
        paths.append(pen.getCommands())
        x += pos.x_advance * scale + tracking * size
    return paths, x - tracking * size


def word(text, size, tracking=-0.012):
    paths, width = shape(text, size, tracking)
    return " ".join(p for p in paths if p), width


def wordmark(size, ox, baseline, colors=(INK, GRAPHITE)):
    """'Mermaid' in ink, 'Preview' in graphite: the same steps of grey as the symbol."""
    a, wa = word("Mermaid", size)
    _, space = shape(" ", size, 0)
    b, wb = word("Preview", size)
    space = space * 0.92
    body = (f'<g transform="translate({ox:.2f} {baseline:.2f})">\n'
            f'    <path fill="{colors[0]}" d="{a}"/>\n'
            f'    <path fill="{colors[1]}" transform="translate({wa + space:.2f} 0)" d="{b}"/>\n  </g>')
    return body, wa + space + wb


# Wordmark alone: cap height 100 on a tight canvas.
size = 100 * upem / cap
body, width = wordmark(size, 0, 100)
write("mermaid-preview-wordmark.svg", svg(f"0 0 {width:.0f} 100", body, "Mermaid Preview"))
body, width = wordmark(size, 0, 100, (PAPER, "#A3A3A3"))
write("mermaid-preview-wordmark-reversed.svg", svg(f"0 0 {width:.0f} 100", body, "Mermaid Preview"))

# Horizontal lockup: cap height ~0.42 of the symbol's drawn height, centred on its optical middle.
cap_h = 72
size = cap_h * upem / cap
gap = 40
baseline = 126 + cap_h / 2
for suffix, sym, colors in [("", (INK, GRAPHITE, SILVER), (INK, GRAPHITE)),
                            ("-reversed", (REV["node"], REV["left"], REV["right"]), (PAPER, "#A3A3A3"))]:
    text, tw = wordmark(size, 242 + gap, baseline, colors)
    total = 242 + gap + tw + 14
    write(f"mermaid-preview-horizontal{suffix}.svg",
          svg(f"0 0 {total:.0f} 256", symbol_paths(*sym) + "\n  " + text, "Mermaid Preview"))

# Stacked lockup: the symbol centred over a smaller wordmark.
cap_s = 56
size = cap_s * upem / cap
_, tw = wordmark(size, 0, 0)
width = max(tw, 256) + 48
baseline = 226 + 34 + cap_s
for suffix, sym, colors in [("", (INK, GRAPHITE, SILVER), (INK, GRAPHITE)),
                            ("-reversed", (REV["node"], REV["left"], REV["right"]), (PAPER, "#A3A3A3"))]:
    text, _ = wordmark(size, (width - tw) / 2, baseline, colors)
    sym_body = f'<g transform="translate({(width - 256) / 2:.2f} 0)">\n  {symbol_paths(*sym)}\n  </g>'
    write(f"mermaid-preview-stacked{suffix}.svg",
          svg(f"0 0 {width:.0f} {baseline + 26:.0f}", sym_body + "\n  " + text, "Mermaid Preview"))

# App icon: the small cut, reversed, on an ink tile (keeps the three tones).
tile = (f'<rect width="256" height="256" rx="56" fill="{INK}"/>\n  '
        f'<g transform="translate(128 124) scale(0.64) translate(-128 -124)">\n  '
        f'{symbol_paths(REV["node"], "#A3A3A3", "#6E6E6E", small=True)}\n  </g>')
write("mermaid-preview-app-icon.svg", svg("0 0 256 256", tile, "Mermaid Preview"))
print("upem", upem, "cap", cap)
