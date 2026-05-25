import type { Mesh } from '../types'
import { Object3D } from './object3d'

// MeshObject = Object3D transform + Mesh geometry。
// 它让“几何数据是什么”和“这一帧摆在哪里”分开，后续同一个 mesh 可以实例化多次。
export class MeshObject extends Object3D {
  constructor(readonly mesh: Mesh) {
    super()
  }
}
