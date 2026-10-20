export type Template = {
  id: string
  label: string
  code: string
}

export const templates: Template[] = [
  {
    id: "flowchart",
    label: "流程图",
    code: `flowchart LR
  A[开始] --> B{是否通过?}
  B -->|是| C[发布]
  B -->|否| D[修改]
  D --> B`,
  },
  {
    id: "sequence",
    label: "时序图",
    code: `sequenceDiagram
  participant U as 用户
  participant S as 服务端
  U->>S: 登录请求
  S-->>U: 返回 Token
  U->>S: 携带 Token 请求数据
  S-->>U: 数据`,
  },
  {
    id: "class",
    label: "类图",
    code: `classDiagram
  class Animal {
    +String name
    +int age
    +makeSound()
  }
  class Duck {
    +swim()
  }
  Animal <|-- Duck`,
  },
  {
    id: "state",
    label: "状态图",
    code: `stateDiagram-v2
  [*] --> 草稿
  草稿 --> 审核中: 提交
  审核中 --> 已发布: 通过
  审核中 --> 草稿: 驳回
  已发布 --> [*]`,
  },
  {
    id: "er",
    label: "ER 图",
    code: `erDiagram
  CUSTOMER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  PRODUCT ||--o{ LINE_ITEM : "ordered in"`,
  },
  {
    id: "gantt",
    label: "甘特图",
    code: `gantt
  title 发布计划
  dateFormat YYYY-MM-DD
  section 设计
  调研      :a1, 2026-01-05, 5d
  原型      :after a1, 4d
  section 开发
  实现      :2026-01-14, 8d
  测试      :3d`,
  },
  {
    id: "pie",
    label: "饼图",
    code: `pie title 流量来源
  "搜索" : 42
  "直接访问" : 28
  "社交" : 18
  "其他" : 12`,
  },
  {
    id: "mindmap",
    label: "思维导图",
    code: `mindmap
  root((产品))
    用户
      新用户
      老用户
    功能
      编辑
      分享`,
  },
  {
    id: "timeline",
    label: "时间线",
    code: `timeline
  title 版本历史
  2024 : v1.0 发布
  2025 : v2.0 重构
       : 插件系统
  2026 : v3.0`,
  },
  {
    id: "git",
    label: "Git 图",
    code: `gitGraph
  commit
  branch feature
  checkout feature
  commit
  commit
  checkout main
  merge feature
  commit`,
  },
]

export const defaultTemplate = templates[0]

// Pele type ids → labels shown in the UI.
const typeLabels: Record<string, string> = {
  flowchart: "流程图",
  sequence: "时序图",
  class: "类图",
  state: "状态图",
  er: "ER 图",
  gantt: "甘特图",
  pie: "饼图",
  mindmap: "思维导图",
  timeline: "时间线",
  gitGraph: "Git 图",
  journey: "用户旅程",
  quadrantChart: "象限图",
  xychart: "XY 图表",
  sankey: "桑基图",
  kanban: "看板",
  block: "块图",
  architecture: "架构图",
  requirement: "需求图",
  c4: "C4 图",
  packet: "数据包图",
  radar: "雷达图",
  treemap: "矩形树图",
}

export function typeLabel(type: string | null | undefined) {
  if (!type) return "未知类型"
  return typeLabels[type] ?? type
}
