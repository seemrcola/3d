import { MeshObject } from './mesh-object'
import { Object3D } from './object3d'

// Scene 是渲染管线读取的对象容器。
// 它不关心 Canvas，也不主动渲染，只负责保存这一帧有哪些对象存在。
export class Scene {
  readonly objects: Object3D[] = []

  // 防止同一个对象被重复添加，否则同一个 mesh 会被渲染多次。
  add(object: Object3D) {
    if (!this.objects.includes(object)) {
      this.objects.push(object)
    }
  }

  remove(object: Object3D) {
    const index = this.objects.indexOf(object)

    if (index !== -1) {
      this.objects.splice(index, 1)
    }
  }

  // 当前渲染器只会画 mesh，所以这里提供一个带类型收窄的筛选方法。
  // 未来如果加入 light / helper / camera，也可以继续放在 objects 里。
  meshObjects(): MeshObject[] {
    return this.objects.filter((object): object is MeshObject => object instanceof MeshObject)
  }
}
