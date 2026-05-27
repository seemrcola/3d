import {
  addVec3,
  lengthVec3,
  scaleVec3,
  subVec3,
  vec3
} from '../core'
import type { Point, Vec3 } from '../core'

export interface GraphPhysicsNode {
  id: string
  position: Vec3
}

export type GraphPhysicsLink = [string, string]

export interface GraphPhysicsOptions {
  nodes: GraphPhysicsNode[]
  links: GraphPhysicsLink[]
}

export interface ProjectedNodeHitArea {
  id: string
  point: Point
  radius: number
}

interface PhysicsNodeState {
  // position 是当前世界坐标，由力学积分持续更新。
  position: Vec3
  // velocity 是速度。阻尼会逐渐降低速度，让布局趋于稳定。
  velocity: Vec3
}

interface IndexedPhysicsNodeState extends PhysicsNodeState {
  // 放入空间网格后仍然需要知道这个 state 属于哪个节点。
  id: string
}

// 这些常量故意保留在文件顶部，方便学习和调参。
// SPRING_STRENGTH：边像弹簧一样把两个端点拉回原始距离。
// ANCHOR_STRENGTH：节点会被轻微拉回初始位置，避免整张图无限漂走。
// REPULSION_STRENGTH / REPULSION_RADIUS：过近节点之间的排斥力。
// DAMPING：速度衰减，值越小越“黏”，值越大越“弹”。
const SPRING_STRENGTH = 18
const ANCHOR_STRENGTH = 2.8
const REPULSION_STRENGTH = 0.62
const REPULSION_RADIUS = 0.95
const DAMPING = 0.86

// 空间网格中，一个节点只需要检查自己所在格子和周围相邻格子。
// 三个轴各 [-1, 0, 1]，组合起来就是 27 个格子。
const NEIGHBOR_OFFSETS = [-1, 0, 1]

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export class GraphPhysics {
  // states 是物理系统的主状态表。UI 不直接修改它，只通过 setDraggedNode 等 API。
  private readonly states = new Map<string, PhysicsNodeState>()

  // anchors 记录节点初始位置。anchorForce 会把节点轻轻拉回初始布局附近。
  private readonly anchors = new Map<string, Vec3>()

  // 每条边的原始长度作为弹簧的 rest length。
  private readonly restLengths = new Map<string, number>()
  private draggedNodeId: string | null = null

  // 只给测试和学习观察用：上一帧排斥力实际检查了多少对节点。
  // 没有空间网格时，128 个节点大约会检查 8128 对。
  private repulsionPairChecks = 0

  constructor(private readonly links: GraphPhysicsLink[]) {}

  addNode(node: GraphPhysicsNode) {
    this.states.set(node.id, {
      position: node.position,
      velocity: vec3(0, 0, 0)
    })
    this.anchors.set(node.id, node.position)
  }

  initializeRestLengths() {
    // 记录每条边的初始距离。之后节点被拖动时，弹簧会尝试回到这个距离。
    for (const [fromId, toId] of this.links) {
      const from = this.states.get(fromId)
      const to = this.states.get(toId)
      if (!from || !to) continue

      this.restLengths.set(this.linkKey(fromId, toId), lengthVec3(subVec3(to.position, from.position)))
    }
  }

  positionOf(id: string): Vec3 {
    const state = this.states.get(id)
    if (!state) throw new Error(`Unknown graph node: ${id}`)

    return state.position
  }

  setDraggedNode(id: string, position: Vec3) {
    const state = this.states.get(id)
    if (!state) return

    // 被拖拽节点不参与普通积分，位置由鼠标直接指定。
    this.draggedNodeId = id
    state.position = position
    state.velocity = vec3(0, 0, 0)
  }

  releaseDraggedNode() {
    this.draggedNodeId = null
  }

  lastRepulsionPairChecks(): number {
    return this.repulsionPairChecks
  }

  step(dt: number) {
    // 典型 force simulation 的一帧：
    // 1. 给每个节点准备一个初始为 0 的合力。
    // 2. 把弹簧力和排斥力累加进去。
    // 3. 对每个未拖拽节点做一次速度/位置积分。
    const forces = new Map<string, Vec3>()
    for (const id of this.states.keys()) {
      forces.set(id, vec3(0, 0, 0))
    }

    this.applySpringForces(forces)
    this.applyRepulsionForces(forces)

    for (const [id, state] of this.states) {
      if (id === this.draggedNodeId) continue

      const anchor = this.anchors.get(id)!
      const anchorForce = scaleVec3(subVec3(anchor, state.position), ANCHOR_STRENGTH)
      const totalForce = addVec3(forces.get(id)!, anchorForce)

      // 这里使用最简单的显式欧拉积分：
      // velocity += force * dt
      // position += velocity * dt
      // 再乘 DAMPING 做阻尼。
      const velocity = scaleVec3(addVec3(state.velocity, scaleVec3(totalForce, dt)), DAMPING)

      state.velocity = velocity
      state.position = addVec3(state.position, scaleVec3(velocity, dt))
    }
  }

  hitTest(pointer: Point, hitAreas: ProjectedNodeHitArea[]): string | null {
    // hitTest 在 2D 屏幕空间做。它不属于物理模拟本身，
    // 但放在这里是为了让 graph 交互层复用同一套节点选择逻辑。
    let best: { id: string; distance: number } | null = null

    for (const area of hitAreas) {
      const hitDistance = distance(pointer, area.point)
      if (hitDistance > area.radius) continue
      if (!best || hitDistance < best.distance) {
        best = { id: area.id, distance: hitDistance }
      }
    }

    return best?.id ?? null
  }

  private applySpringForces(forces: Map<string, Vec3>) {
    // 弹簧力只沿边发生。边越被拉长，回拉力越大；边被压短时则会推开。
    for (const [fromId, toId] of this.links) {
      const from = this.states.get(fromId)
      const to = this.states.get(toId)
      if (!from || !to) continue

      const delta = subVec3(to.position, from.position)
      const currentLength = lengthVec3(delta)
      if (currentLength === 0) continue

      const restLength = this.restLengths.get(this.linkKey(fromId, toId)) ?? currentLength
      const direction = scaleVec3(delta, 1 / currentLength)
      const force = scaleVec3(direction, (currentLength - restLength) * SPRING_STRENGTH)

      forces.set(fromId, addVec3(forces.get(fromId)!, force))
      forces.set(toId, subVec3(forces.get(toId)!, force))
    }
  }

  private applyRepulsionForces(forces: Map<string, Vec3>) {
    this.repulsionPairChecks = 0
    const entries = Array.from(this.states.entries())

    // 关键优化：先把节点放进空间网格。
    // 这样每个节点只需要检查附近格子，不用和所有节点两两比较。
    const grid = this.buildSpatialGrid(entries)

    for (const [aId, a] of entries) {
      for (const b of this.nearbyNodes(a.position, grid)) {
        // aId >= b.id 用来保证每对节点只处理一次。
        // 字符串比较不是为了排序业务含义，只是一个稳定的去重条件。
        if (aId >= b.id) continue

        this.repulsionPairChecks += 1
        this.applyRepulsionPair(aId, a, b.id, b, forces)
      }
    }
  }

  private applyRepulsionPair(
    aId: string,
    a: PhysicsNodeState,
    bId: string,
    b: PhysicsNodeState,
    forces: Map<string, Vec3>
  ) {
    // 排斥力只在 REPULSION_RADIUS 内生效。
    // 如果两个节点很远，就完全不用给它们施加排斥。
    const delta = subVec3(b.position, a.position)
    const currentLength = lengthVec3(delta)
    if (currentLength === 0 || currentLength >= REPULSION_RADIUS) return

    const direction = scaleVec3(delta, 1 / currentLength)
    const strength = (1 - currentLength / REPULSION_RADIUS) * REPULSION_STRENGTH
    const force = scaleVec3(direction, strength)

    forces.set(aId, subVec3(forces.get(aId)!, force))
    forces.set(bId, addVec3(forces.get(bId)!, force))
  }

  private buildSpatialGrid(entries: [string, PhysicsNodeState][]): Map<string, IndexedPhysicsNodeState[]> {
    const grid = new Map<string, IndexedPhysicsNodeState[]>()

    // cellKey 把连续的 3D 坐标离散化成 “x,y,z” 字符串。
    // 同一个格子里的节点存到同一个 bucket。
    for (const [id, state] of entries) {
      const key = this.cellKey(state.position)
      const bucket = grid.get(key)
      if (bucket) {
        bucket.push({ id, ...state })
      } else {
        grid.set(key, [{ id, ...state }])
      }
    }

    return grid
  }

  private nearbyNodes(position: Vec3, grid: Map<string, IndexedPhysicsNodeState[]>): IndexedPhysicsNodeState[] {
    const cell = this.cellCoordinates(position)
    const result: IndexedPhysicsNodeState[] = []

    // 只收集当前格子和周围 26 个格子的节点。
    // 如果 REPULSION_RADIUS 等于格子尺寸，超过相邻格子的节点一定不会产生排斥。
    for (const dx of NEIGHBOR_OFFSETS) {
      for (const dy of NEIGHBOR_OFFSETS) {
        for (const dz of NEIGHBOR_OFFSETS) {
          const bucket = grid.get(`${cell.x + dx},${cell.y + dy},${cell.z + dz}`)
          if (bucket) result.push(...bucket)
        }
      }
    }

    return result
  }

  private cellCoordinates(position: Vec3): { x: number; y: number; z: number } {
    // Math.floor 支持负坐标：-0.2 / radius 会落到 -1 格。
    return {
      x: Math.floor(position.x / REPULSION_RADIUS),
      y: Math.floor(position.y / REPULSION_RADIUS),
      z: Math.floor(position.z / REPULSION_RADIUS)
    }
  }

  private cellKey(position: Vec3): string {
    const cell = this.cellCoordinates(position)

    return `${cell.x},${cell.y},${cell.z}`
  }

  private linkKey(fromId: string, toId: string): string {
    return `${fromId}->${toId}`
  }
}

export function createGraphPhysics(options: GraphPhysicsOptions): GraphPhysics {
  // 工厂函数把“创建对象、加入节点、初始化边长”三个步骤打包起来。
  // 调用方不需要记住 initializeRestLengths 的调用顺序。
  const physics = new GraphPhysics(options.links)
  for (const node of options.nodes) {
    physics.addNode(node)
  }
  physics.initializeRestLengths()

  return physics
}
