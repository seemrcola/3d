import { describe, expect, test } from 'bun:test'
import { createGraphPhysics } from '../src/graph/physics'
import { vec3 } from '../src/core'

describe('graph physics', () => {
  test('pulls linked nodes after dragging one node', () => {
    const physics = createGraphPhysics({
      nodes: [
        { id: 'engine', position: vec3(0, 0, 6) },
        { id: 'graph', position: vec3(1, 0, 6) },
        { id: 'layout', position: vec3(4, 0, 6) }
      ],
      links: [
        ['engine', 'graph']
      ]
    })

    physics.setDraggedNode('engine', vec3(3, 0, 6))
    physics.step(1 / 30)
    physics.step(1 / 30)
    physics.releaseDraggedNode()

    const engine = physics.positionOf('engine')
    const graph = physics.positionOf('graph')
    const layout = physics.positionOf('layout')

    expect(engine.x).toBeCloseTo(3)
    expect(graph.x).toBeGreaterThan(1)
    expect(layout.x).toBeCloseTo(4)
  })

  test('finds the nearest projected node inside the hit radius', () => {
    const physics = createGraphPhysics({
      nodes: [
        { id: 'a', position: vec3(0, 0, 6) },
        { id: 'b', position: vec3(1, 0, 6) }
      ],
      links: []
    })

    const hit = physics.hitTest(
      { x: 113, y: 104 },
      [
        { id: 'a', point: { x: 100, y: 100 }, radius: 24 },
        { id: 'b', point: { x: 160, y: 100 }, radius: 24 }
      ]
    )

    expect(hit).toBe('a')
  })

  test('pushes unlinked nodes apart when they are too close', () => {
    const physics = createGraphPhysics({
      nodes: [
        { id: 'a', position: vec3(0, 0, 6) },
        { id: 'b', position: vec3(0.2, 0, 6) }
      ],
      links: []
    })

    physics.step(1 / 30)
    physics.step(1 / 30)

    expect(physics.positionOf('a').x).toBeLessThan(0)
    expect(physics.positionOf('b').x).toBeGreaterThan(0.2)
  })

  test('limits repulsion checks with a spatial grid', () => {
    const nodes = Array.from({ length: 128 }, (_, index) => ({
      id: `node-${index}`,
      position: vec3(index * 1.5, 0, 6)
    }))
    const physics = createGraphPhysics({ nodes, links: [] })

    physics.step(1 / 30)

    expect(physics.lastRepulsionPairChecks()).toBeLessThan(400)
  })
})
