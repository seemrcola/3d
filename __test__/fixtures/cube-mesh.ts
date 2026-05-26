import { type Mesh, vec3 } from '../../src/core'

export const TEST_CUBE_MESH: Mesh = {
  vertices: [
    vec3(0.25, 0.25, 0.25),
    vec3(-0.25, 0.25, 0.25),
    vec3(-0.25, -0.25, 0.25),
    vec3(0.25, -0.25, 0.25),
    vec3(0.25, 0.25, -0.25),
    vec3(-0.25, 0.25, -0.25),
    vec3(-0.25, -0.25, -0.25),
    vec3(0.25, -0.25, -0.25)
  ],
  faces: [
    { vertices: [0, 1, 2, 3], color: '#E85D75' },
    { vertices: [4, 7, 6, 5], color: '#3A86FF' },
    { vertices: [0, 4, 5, 1], color: '#FFD166' },
    { vertices: [3, 2, 6, 7], color: '#06D6A0' },
    { vertices: [1, 5, 6, 2], color: '#B8F35A' },
    { vertices: [0, 3, 7, 4], color: '#FF9F1C' }
  ]
}
