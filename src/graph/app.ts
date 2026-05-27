import { Canvas3DRenderer } from '../render'
import {
  PerspectiveCamera,
  Scene,
  vec3
} from '../core'
import type { Point, Vec3 } from '../core'
import { createEntryGraph } from './data'
import type { GraphNode } from './data'
import { createGraphPhysics } from './physics'

interface ProjectedGraphNode {
  // 原始业务节点数据，包含 label / color / detail 等 UI 需要的信息。
  node: GraphNode
  // 物理系统当前给出的 3D 世界坐标。
  position: Vec3
  // 经过 PerspectiveCamera.projectPoint 后得到的屏幕像素坐标。
  point: Point
  // 根据节点 size、深度和交互状态算出的屏幕半径。
  radius: number
  // active 表示节点被选中或 hover，用于增强颜色和描边。
  active: boolean
  // linked 表示节点和当前 active 节点相连，用于“一跳邻居”高亮。
  linked: boolean
}

const canvas = document.querySelector('#graph') as HTMLCanvasElement
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D

// graph 页面仍然复用 core 里的 PerspectiveCamera。
// 这里的 Scene 是空场景：renderer.render(scene, camera) 主要用来清屏。
// 节点和边不再作为 MeshObject 渲染，而是在清屏后用 Canvas 2D 叠加绘制。
const scene = new Scene()
const camera = new PerspectiveCamera({
  fov: Math.PI / 2.45,
  aspect: 1,
  near: 0.1,
  far: 80
})

// createEntryGraph 生成“项目入口结构图”：
// index.html 和 graph.html 是两个入口节点，分别指向 demo / graph 模块。
// 如果要做压力测试，可以在这里临时改成 createStressGraph(128)。
const graph = createEntryGraph()

// 邻接表把 links 从“边列表”变成“节点 -> 邻居集合”。
// 这样判断两个节点是否相连时不需要每次扫描所有边。
const adjacency = new Map<string, Set<string>>()
for (const [fromId, toId] of graph.links) {
  if (!adjacency.has(fromId)) adjacency.set(fromId, new Set())
  if (!adjacency.has(toId)) adjacency.set(toId, new Set())
  adjacency.get(fromId)!.add(toId)
  adjacency.get(toId)!.add(fromId)
}

const physics = createGraphPhysics({
  nodes: graph.nodes.map(node => ({ id: node.id, position: vec3(...node.position) })),
  links: graph.links
})

// width / height 是 CSS 像素尺寸；canvas.width / canvas.height 会乘以 dpr。
let width = 0
let height = 0
let renderer: Canvas3DRenderer

// 交互状态：
// selectedNodeId：点击后固定选中的节点，驱动 inspector。
// hoveredNodeId：鼠标当前经过的节点，只做临时高亮。
// draggedNodeId：正在拖拽的节点，物理系统会把它锁到指针位置。
let selectedNodeId: string | null = 'entry-graph'
let hoveredNodeId: string | null = null
let draggedNodeId: string | null = null
let lastFrameTime = 0

// 每一帧把 3D 节点投影成 ProjectedGraphNode 后放在这里。
// drawLinks / drawSpheres / drawLabels 都只读这个缓存，避免重复投影。
let projectedNodes: ProjectedGraphNode[] = []
let projectedNodeById = new Map<string, ProjectedGraphNode>()
const inspector = document.querySelector('#inspector') as HTMLElement
const inspectorTitle = document.querySelector('#inspector-title') as HTMLElement
const inspectorType = document.querySelector('#inspector-type') as HTMLElement
const inspectorDetail = document.querySelector('#inspector-detail') as HTMLElement

function projectWorld(point: Vec3) {
  return camera.projectPoint(point, { width, height })
}

function areLinked(a: string | null, b: string): boolean {
  if (!a) return false

  return adjacency.get(a)?.has(b) ?? false
}

function nodeById(id: string | null): GraphNode | null {
  if (!id) return null

  return graph.nodes.find(node => node.id === id) ?? null
}

function selectedLinkOpacity(fromId: string, toId: string): number {
  const activeNodeId = hoveredNodeId ?? selectedNodeId
  if (!activeNodeId) return 0.34
  if (fromId === activeNodeId || toId === activeNodeId) return 0.82

  return 0.12
}

function nodeRadius(node: GraphNode, position: Vec3): number {
  // 透视投影里，同样大小的物体会随着 z 变远而变小。
  // 这里用一个简单的 size / cameraZ 公式模拟 billboard 的“近大远小”。
  const cameraZ = position.z - camera.position.z
  const isSelected = node.id === selectedNodeId
  const isHovered = node.id === hoveredNodeId
  const isLinked = areLinked(hoveredNodeId ?? selectedNodeId, node.id)
  const activeScale = isSelected ? 1.42 : isHovered ? 1.32 : isLinked ? 1.14 : 0.92

  return Math.max(3.6, node.size * 360 / cameraZ * activeScale)
}

function updateProjectedNodes() {
  // 这是 graph 页面最重要的桥接步骤：
  // 1. 物理层维护 3D 世界坐标。
  // 2. camera 把 3D 点投影成屏幕像素点。
  // 3. Canvas 2D 根据屏幕点画球、线和文字。
  projectedNodes = graph.nodes.flatMap(node => {
    const position = physics.positionOf(node.id)
    const point = projectWorld(position)
    if (!point) return []

    const active = node.id === selectedNodeId || node.id === hoveredNodeId
    const linked = areLinked(hoveredNodeId ?? selectedNodeId, node.id)

    return [{
      node,
      position,
      point,
      radius: nodeRadius(node, position),
      active,
      linked
    }]
  }).sort((a, b) => b.position.z - a.position.z)

  // Map 供边绘制 O(1) 查找端点，避免每条边都 Array.find。
  projectedNodeById = new Map(projectedNodes.map(item => [item.node.id, item]))
}

function drawLinks() {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineWidth = 1.35

  for (const [fromId, toId] of graph.links) {
    const from = projectedNodeById.get(fromId)
    const to = projectedNodeById.get(toId)
    if (!from || !to) continue

    const opacity = selectedLinkOpacity(fromId, toId)
    ctx.strokeStyle = `rgba(150, 184, 255, ${opacity})`
    ctx.beginPath()
    ctx.moveTo(from.point.x, from.point.y)

    // 关系边使用二次贝塞尔曲线，不是直线。
    // 少量边时更有层次；大规模边时可以改回 lineTo 减少绘制成本。
    const cx = (from.point.x + to.point.x) / 2
    const cy = (from.point.y + to.point.y) / 2 - 18
    ctx.quadraticCurveTo(cx, cy, to.point.x, to.point.y)
    ctx.stroke()
  }

  ctx.restore()
}

function drawSpheres() {
  ctx.save()

  for (const { node, point, radius, active, linked } of projectedNodes) {
    const alpha = active || linked ? 1 : 0.66

    // 节点不是 3D mesh，而是 billboard：
    // 它永远面向屏幕，位置来自 3D 投影，外观用 Canvas 径向渐变模拟球体高光。
    const gradient = ctx.createRadialGradient(
      point.x - radius * 0.35,
      point.y - radius * 0.42,
      radius * 0.12,
      point.x,
      point.y,
      radius
    )

    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.96)')
    gradient.addColorStop(0.22, `${node.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`)
    gradient.addColorStop(1, 'rgba(5, 7, 11, 0.82)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = active ? 'rgba(255, 255, 255, 0.9)' : `${node.color}8f`
    ctx.lineWidth = active ? 1.6 : 0.75
    ctx.stroke()
  }

  ctx.restore()
}

function drawHoverRings() {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'

  for (const { node, point, radius } of projectedNodes) {
    const isSelected = node.id === selectedNodeId
    const isHovered = node.id === hoveredNodeId
    if (!isSelected && !isHovered) continue

    ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 0.82)' : `${node.color}cc`
    ctx.lineWidth = isHovered ? 2.2 : 1.4
    ctx.beginPath()
    ctx.arc(point.x, point.y, radius + 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  ctx.restore()
}

function drawLabels() {
  ctx.save()
  ctx.font = '600 13px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const { node, position, point, radius } of projectedNodes) {
    const cameraZ = position.z - camera.position.z
    const isSelected = node.id === selectedNodeId
    const isHovered = node.id === hoveredNodeId
    const isActiveNeighbor = areLinked(hoveredNodeId ?? selectedNodeId, node.id)

    // 标签是 graph 页面最容易造成视觉拥挤和性能消耗的部分。
    // 规则：核心节点(priority >= 3)、选中节点、hover 节点、一跳邻居才显示标签。
    if (!isSelected && !isHovered && !isActiveNeighbor && node.priority < 3) continue

    const alpha = isSelected || isHovered || isActiveNeighbor
      ? 1
      : Math.max(0.34, Math.min(0.72, 1.05 - cameraZ / 12))
    const y = point.y - radius - 12
    const textWidth = ctx.measureText(node.label).width

    ctx.fillStyle = isSelected || isHovered ? 'rgba(95, 214, 199, 0.24)' : `rgba(8, 11, 16, ${0.54 * alpha})`
    roundRect(point.x - textWidth / 2 - 8, y - 10, textWidth + 16, 20, 5)
    ctx.fill()

    ctx.fillStyle = `rgba(245, 247, 251, ${alpha})`
    ctx.fillText(node.label, point.x, y)
  }

  ctx.restore()
}

function updateInspector() {
  const node = nodeById(selectedNodeId)
  if (!node) {
    inspector.hidden = true
    return
  }

  inspector.hidden = false
  inspectorTitle.textContent = node.label
  inspectorType.textContent = node.type
  inspectorDetail.textContent = node.detail
  inspector.style.setProperty('--node-color', node.color)
}

function roundRect(x: number, y: number, rectWidth: number, rectHeight: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + rectWidth, y, x + rectWidth, y + rectHeight, radius)
  ctx.arcTo(x + rectWidth, y + rectHeight, x, y + rectHeight, radius)
  ctx.arcTo(x, y + rectHeight, x, y, radius)
  ctx.arcTo(x, y, x + rectWidth, y, radius)
  ctx.closePath()
}

function resize() {
  const dpr = window.devicePixelRatio || 1
  width = window.innerWidth
  height = window.innerHeight
  canvas.width = Math.floor(width * dpr)
  canvas.height = Math.floor(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  camera.aspect = width / height
  // renderer 仍然负责清屏，保持和原 3D demo 同一套背景/viewport 管理方式。
  renderer = new Canvas3DRenderer(ctx, {
    backgroundColor: 'rgba(5, 7, 11, 1)',
    fillAlpha: 0.92,
    outlineColor: 'rgba(255, 255, 255, 0.78)',
    outlineWidth: 1,
    viewport: { width, height }
  })
}

function updateNodes(dt: number) {
  // 先让物理系统更新世界坐标，再把最新坐标投影到屏幕。
  physics.step(dt)
  updateProjectedNodes()
}

function frame(time: number) {
  const dt = lastFrameTime === 0 ? 1 / 60 : Math.min(0.04, (time - lastFrameTime) / 1000)
  lastFrameTime = time

  updateNodes(dt)

  // 空 Scene 渲染只负责清屏。之后的 links / spheres / labels 都是 Canvas 2D overlay。
  renderer.render(scene, camera)
  drawLinks()
  drawSpheres()
  drawHoverRings()
  drawLabels()

  requestAnimationFrame(frame)
}

function projectedHitAreas() {
  // 命中测试使用投影后的屏幕空间圆形区域。
  // 这比在 3D 里做射线拾取简单很多，适合当前学习项目。
  return projectedNodes.map(({ node, point, radius }) => ({
    id: node.id,
    point,
    radius: Math.max(14, radius + 8)
  }))
}

function screenToWorld(pointer: { x: number; y: number }, z: number): Vec3 {
  // 拖拽时把屏幕坐标“反投影”回某个固定 z 平面。
  // 因为当前相机不能旋转，所以反推公式正好是 projectPoint 的逆过程。
  const scale = Math.tan(camera.fov / 2)
  const normalizedX = pointer.x / width * 2 - 1
  const normalizedY = 1 - pointer.y / height * 2

  return vec3(
    normalizedX * z * scale * camera.aspect + camera.position.x,
    normalizedY * z * scale + camera.position.y,
    z
  )
}

canvas.addEventListener('pointerdown', event => {
  // 点到节点：选中并开始拖拽。
  // 点到空白：取消选中，并隐藏 inspector。
  const hit = physics.hitTest({ x: event.clientX, y: event.clientY }, projectedHitAreas())
  if (!hit) {
    selectedNodeId = null
    updateInspector()
    return
  }

  selectedNodeId = hit
  draggedNodeId = hit
  updateInspector()
  const position = physics.positionOf(hit)
  physics.setDraggedNode(hit, screenToWorld({ x: event.clientX, y: event.clientY }, position.z))
  canvas.setPointerCapture(event.pointerId)
})

canvas.addEventListener('pointermove', event => {
  if (!draggedNodeId) {
    // 没有拖拽时只更新 hover 状态。
    hoveredNodeId = physics.hitTest({ x: event.clientX, y: event.clientY }, projectedHitAreas())
    canvas.style.cursor = hoveredNodeId ? 'grab' : 'default'
    return
  }

  canvas.style.cursor = 'grabbing'
  const position = physics.positionOf(draggedNodeId)

  // 正在拖拽时，节点被物理系统锁定到指针对应的世界坐标。
  // 其他节点仍然通过弹簧、锚点和排斥力跟随移动。
  physics.setDraggedNode(draggedNodeId, screenToWorld({ x: event.clientX, y: event.clientY }, position.z))
})

canvas.addEventListener('pointerup', event => {
  draggedNodeId = null
  physics.releaseDraggedNode()
  canvas.style.cursor = hoveredNodeId ? 'grab' : 'default'
  canvas.releasePointerCapture(event.pointerId)
})

window.addEventListener('resize', resize)
resize()
updateProjectedNodes()
updateInspector()
requestAnimationFrame(frame)
