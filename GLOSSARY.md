# Mermaid Preview

A browser app for writing Mermaid diagrams and laying them out on infinite canvases, saved on the user's own machine.

## Language

**Diagram**:
One Mermaid source with a title, placed at a position on its canvas. Belongs to exactly one canvas.
_Avoid_: Chart, card, layer, node

**Canvas**:
A named, infinite surface holding its own diagrams, with the user's pan and zoom on it; only the current canvas is shown. There is always at least one.
_Avoid_: Folder, group, page, board, workspace

**Current canvas**:
The canvas being viewed and edited; new diagrams go into it.
_Avoid_: Active canvas, open canvas

**Default canvas**:
The canvas created for a user who has none yet. An ordinary canvas in every other respect.
_Avoid_: Root canvas, inbox
