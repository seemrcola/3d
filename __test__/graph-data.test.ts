import { describe, expect, test } from 'bun:test'
import { createEntryGraph, createStressGraph } from '../src/graph/data'

describe('graph data', () => {
  test('models index.html and graph.html as separate entry points', () => {
    const graph = createEntryGraph()

    expect(graph.nodes.map(node => node.id)).toContain('entry-index')
    expect(graph.nodes.map(node => node.id)).toContain('entry-graph')
    expect(graph.links).toContainEqual(['entry-index', 'demo-index'])
    expect(graph.links).toContainEqual(['entry-graph', 'graph-index'])
  })

  test('creates a deterministic graph with more than one hundred nodes', () => {
    const graph = createStressGraph(128)

    expect(graph.nodes).toHaveLength(128)
    expect(graph.links.length).toBeGreaterThan(128)
    expect(graph.nodes[0]!.id).toBe('you')
    expect(graph.nodes.some(node => node.id === 'node-127')).toBe(true)
  })
})
