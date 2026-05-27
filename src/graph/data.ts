export type GraphNodeType = 'Person' | 'Project' | 'System'

export interface GraphNode {
  id: string
  label: string
  type: GraphNodeType
  color: string
  position: [number, number, number]
  size: number
  detail: string
  priority: number
}

export type GraphLink = [string, string]

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

const TYPE_COLORS: Record<GraphNodeType, string> = {
  Person: '#5fd6c7',
  Project: '#ffce6b',
  System: '#7aa2ff'
}

// 这组 coreNodes 是早期 graph demo 的数据，保留给 createStressGraph 使用。
// 它表示“3D core 是否适合做 graph”的概念图。
function coreNodes(): GraphNode[] {
  return [
    { id: 'you', label: 'You', type: 'Person', color: TYPE_COLORS.Person, position: [-1.95, 0.26, 6], size: 0.18, detail: 'External user or operator interacting with graph entities.', priority: 4 },
    { id: 'engine', label: '3D Core', type: 'System', color: TYPE_COLORS.System, position: [-0.45, 0.08, 5.45], size: 0.24, detail: 'Perspective camera, mesh transforms, face sorting, and Canvas rendering.', priority: 5 },
    { id: 'graph', label: 'Graph', type: 'Project', color: TYPE_COLORS.Project, position: [1.15, 0.22, 5.7], size: 0.22, detail: 'Interaction layer that turns projected nodes into a usable relationship map.', priority: 5 },
    { id: 'camera', label: 'Camera', type: 'System', color: TYPE_COLORS.System, position: [-0.8, 1.05, 6.25], size: 0.16, detail: 'Projects world coordinates into screen positions for nodes, links, and hit areas.', priority: 3 },
    { id: 'mesh', label: 'Mesh Node', type: 'System', color: TYPE_COLORS.System, position: [0.32, -0.95, 6.15], size: 0.16, detail: 'Small 3D primitives that make each graph entity visible in depth.', priority: 3 },
    { id: 'layout', label: 'Layout', type: 'Project', color: TYPE_COLORS.Project, position: [2.05, -0.55, 6.55], size: 0.16, detail: 'Spring links, local anchors, repulsion, damping, and drag constraints.', priority: 3 },
    { id: 'events', label: 'Picking', type: 'Project', color: TYPE_COLORS.Project, position: [1.75, 1.06, 6.85], size: 0.16, detail: 'Pointer hit testing, hover feedback, selected state, and drag targets.', priority: 3 }
  ]
}

// coreLinks 和 coreNodes 配套，用于压力测试图的基础骨架。
function coreLinks(): GraphLink[] {
  return [
    ['you', 'engine'],
    ['engine', 'graph'],
    ['engine', 'camera'],
    ['engine', 'mesh'],
    ['graph', 'layout'],
    ['graph', 'events'],
    ['mesh', 'graph'],
    ['camera', 'graph']
  ]
}

export function createEntryGraph(): GraphData {
  // 当前 graph.html 默认展示这张“项目入口结构图”。
  // 目标不是模拟真实业务数据，而是帮助学习者看清：
  // - index.html 入口只加载 demo 模块。
  // - graph.html 入口只加载 graph 模块。
  // - 两个入口共享 core / renderer，但页面控制逻辑互相隔离。
  return {
    nodes: [
      { id: 'entry-index', label: 'index.html', type: 'Project', color: TYPE_COLORS.Project, position: [-2.05, 0.42, 5.65], size: 0.24, detail: 'Main demo HTML entry. It mounts the canvas and loads the isolated demo module.', priority: 5 },
      { id: 'entry-graph', label: 'graph.html', type: 'Project', color: TYPE_COLORS.Project, position: [2.05, 0.42, 5.65], size: 0.24, detail: 'Relationship graph HTML entry. It mounts the graph canvas and loads the isolated graph module.', priority: 5 },
      { id: 'demo-index', label: 'src/demo/index.ts', type: 'System', color: TYPE_COLORS.System, position: [-2.25, -0.66, 6.08], size: 0.16, detail: 'Demo page controller for cube and teapot rendering.', priority: 4 },
      { id: 'graph-index', label: 'src/graph/app.ts', type: 'System', color: TYPE_COLORS.System, position: [2.15, -0.66, 6.08], size: 0.16, detail: 'Graph page controller for projected nodes, links, labels, drag interaction, and inspector state.', priority: 4 },
      { id: 'graph-data', label: 'src/graph/data.ts', type: 'System', color: TYPE_COLORS.System, position: [1.12, -1.55, 6.45], size: 0.13, detail: 'Defines graph nodes and links, including this entry-point structure.', priority: 3 },
      { id: 'graph-physics', label: 'src/graph/physics.ts', type: 'System', color: TYPE_COLORS.System, position: [2.95, -1.54, 6.52], size: 0.13, detail: 'Runs drag locking, spring links, damping, repulsion, and hit testing.', priority: 3 },
      { id: 'renderer', label: 'src/render.ts', type: 'System', color: TYPE_COLORS.System, position: [0, 0.18, 6.3], size: 0.15, detail: 'Canvas adapter over the core render commands. The demo uses it for mesh rendering; graph uses it to clear the scene.', priority: 3 },
      { id: 'core', label: 'src/core', type: 'System', color: TYPE_COLORS.System, position: [0, -0.82, 6.72], size: 0.17, detail: 'Shared 3D engine core: camera projection, scene objects, math, meshes, pipeline, and OBJ loading.', priority: 4 },
      { id: 'models', label: 'models/*.obj', type: 'Project', color: TYPE_COLORS.Project, position: [-3.08, -1.52, 6.52], size: 0.13, detail: 'OBJ assets used by the index.html demo path.', priority: 3 },
      { id: 'tests', label: '__test__', type: 'Project', color: TYPE_COLORS.Project, position: [0, -1.92, 7.05], size: 0.13, detail: 'Unit tests for the renderer core, graph physics, and graph data shape.', priority: 3 }
    ],
    links: [
      ['entry-index', 'demo-index'],
      ['demo-index', 'renderer'],
      ['demo-index', 'core'],
      ['demo-index', 'models'],
      ['entry-graph', 'graph-index'],
      ['graph-index', 'graph-data'],
      ['graph-index', 'graph-physics'],
      ['graph-index', 'renderer'],
      ['graph-index', 'core'],
      ['renderer', 'core'],
      ['graph-data', 'tests'],
      ['graph-physics', 'tests'],
      ['core', 'tests']
    ]
  }
}

function generatedNode(index: number): GraphNode {
  // 压力测试节点按环形分布，保证每次刷新都是同样的数据。
  // 这里没有用随机数，是为了测试和截图都可复现。
  const ringIndex = index - 7
  const ring = Math.floor(ringIndex / 24)
  const slot = ringIndex % 24
  const angle = slot / 24 * Math.PI * 2 + ring * 0.28
  const radius = 1.65 + ring * 0.54
  const z = 5.7 + ((slot % 7) - 3) * 0.22 + ring * 0.05
  const type: GraphNodeType = index % 3 === 0 ? 'System' : index % 3 === 1 ? 'Project' : 'Person'

  return {
    id: `node-${index}`,
    label: `Node ${index}`,
    type,
    color: TYPE_COLORS[type],
    position: [
      Math.cos(angle) * radius,
      Math.sin(angle) * radius * 0.72,
      z
    ],
    size: 0.08 + (index % 5) * 0.008,
    detail: `Synthetic ${type.toLowerCase()} node used for dense graph stress testing.`,
    priority: index % 16 === 0 ? 2 : 1
  }
}

export function createStressGraph(nodeCount = 128): GraphData {
  // createStressGraph 用来观察上百节点时的性能。
  // graph.html 默认不使用它；需要压力测试时可以在 app.ts 里临时切换。
  const count = Math.max(7, nodeCount)
  const nodes = coreNodes()

  for (let i = nodes.length; i < count; i++) {
    nodes.push(generatedNode(i))
  }

  const links = coreLinks()
  for (let i = 7; i < nodes.length; i++) {
    const clusterHub = i % 2 === 0 ? 'graph' : 'engine'
    links.push([clusterHub, nodes[i]!.id])

    if (i > 7) {
      links.push([nodes[i - 1]!.id, nodes[i]!.id])
    }

    if (i % 5 === 0 && i - 5 >= 7) {
      links.push([nodes[i - 5]!.id, nodes[i]!.id])
    }
  }

  return { nodes, links }
}
