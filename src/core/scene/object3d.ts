import type { Mat4, Vec3 } from '../math'
import {
  multiplyMat4,
  rotationXMat4,
  rotationYMat4,
  rotationZMat4,
  scaleMat4,
  translationMat4,
  vec3
} from '../math'

// Object3D 是场景里所有对象的共同基类。
// 它只关心空间变换，不关心对象最终是 mesh、light 还是 camera。
export class Object3D {
  // position / rotation / scale 使用可替换的 Vec3，demo 里每帧直接赋新值即可。
  position: Vec3 = vec3(0, 0, 0)
  rotation: Vec3 = vec3(0, 0, 0)
  scale: Vec3 = vec3(1, 1, 1)

  // localMatrix 把对象自己的局部顶点转换到世界坐标。
  // 顺序是 scale -> rotation -> translation；矩阵相乘时写成 T * R * S。
  get localMatrix(): Mat4 {
    const translation = translationMat4(this.position.x, this.position.y, this.position.z)
    const rotation = multiplyMat4(
      rotationXMat4(this.rotation.x),
      multiplyMat4(rotationYMat4(this.rotation.y), rotationZMat4(this.rotation.z))
    )
    const scale = scaleMat4(this.scale.x, this.scale.y, this.scale.z)

    return multiplyMat4(translation, multiplyMat4(rotation, scale))
  }
}
