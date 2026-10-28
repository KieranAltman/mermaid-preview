import { createElement, type ComponentType, type SVGProps } from "react"
import { ChartGantt, ChartPie, GitGraph, Shapes, Timeline, Workflow } from "lucide-react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 24, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

/** Two lifelines, a message across and a reply back. */
export function SequenceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 3v18" />
      <path d="M19 3v18" />
      <path d="M5 8h14" />
      <path d="m16 5 3 3-3 3" />
      <path d="M19 16H5" />
      <path d="m8 13-3 3 3 3" />
    </Icon>
  )
}

/** A class box: name compartment over its members. */
export function ClassIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M7 13h7" />
      <path d="M7 17h4" />
    </Icon>
  )
}

/** From the start, into a state, and on to the next. */
export function StateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="19" r="2" />
      <path d="M5 17v-4" />
      <rect x="2" y="3" width="9" height="6" rx="3" />
      <rect x="13" y="15" width="9" height="6" rx="3" />
      <path d="M11 6h3a3 3 0 0 1 3 3v6" />
      <path d="m14.5 12.5 2.5 2.5 2.5-2.5" />
    </Icon>
  )
}

/** Two entities joined by a crow's-foot relation. */
export function ErIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3" width="9" height="7" rx="1" />
      <path d="M2 6h9" />
      <rect x="13" y="14" width="9" height="7" rx="1" />
      <path d="M13 17h9" />
      <path d="M11 6.5h6.5V11" />
      <path d="m15.5 14 2-3 2 3" />
    </Icon>
  )
}

/** A central idea branching out to four. */
export function MindmapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="4.5" cy="5" r="2" />
      <circle cx="19.5" cy="5" r="2" />
      <circle cx="4.5" cy="19" r="2" />
      <circle cx="19.5" cy="19" r="2" />
      <path d="M9.8 10 6 6.5" />
      <path d="M14.2 10 18 6.5" />
      <path d="M9.8 14 6 17.5" />
      <path d="M14.2 14 18 17.5" />
    </Icon>
  )
}

type DiagramIcon = ComponentType<IconProps>

// lucide covers five types as is; the rest are drawn above to its rules
// (24×24, 2px padding, 2px stroke, round caps and joins, no fill).
const icons: Record<string, DiagramIcon> = {
  flowchart: Workflow,
  sequence: SequenceIcon,
  class: ClassIcon,
  state: StateIcon,
  er: ErIcon,
  gantt: ChartGantt,
  pie: ChartPie,
  mindmap: MindmapIcon,
  timeline: Timeline,
  gitGraph: GitGraph,
  // The Git template's id.
  git: GitGraph,
}

/** The icon for a diagram type (a render type or a template id); types without their own get a generic one. */
export function DiagramTypeIcon({ type, ...props }: Omit<IconProps, "type"> & { type: string | null | undefined }) {
  return createElement((type && icons[type]) || Shapes, props)
}
