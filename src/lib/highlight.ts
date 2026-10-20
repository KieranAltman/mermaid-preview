import "@/lib/prism-manual"
import Prism from "prismjs"
import "prismjs/components/prism-mermaid"

/** Mermaid source as HTML with Prism's `token <type>` spans; text is escaped. */
export function highlightMermaid(code: string) {
  return Prism.highlight(code, Prism.languages.mermaid, "mermaid")
}
