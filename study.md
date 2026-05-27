# 3D 渲染学习路线

## 这个项目适合学习 3D 渲染吗

适合，而且适合作为入门的第一份软渲染项目。

它没有直接使用 Three.js / WebGL / GPU shader，而是用 TypeScript、Canvas 2D 和少量数学代码手写了一条最小渲染管线。代码量小，核心模块清楚，适合把“3D 点如何变成屏幕上的 2D 图形”这件事从头走一遍。

不过它还不是完整渲染器。现在项目主要覆盖：

- 3D 向量和 4x4 矩阵
- 局部坐标到世界坐标的模型变换
- 透视投影
- viewport 像素映射
- OBJ 模型读取
- near-plane 裁剪
- 简单画家算法深度排序
- Canvas 2D 多边形填充和描边

还没有覆盖，或者只留下了扩展空间的内容：

- 相机旋转和完整 view matrix
- z-buffer / depth buffer
- back-face culling
- 光照模型
- 材质和纹理
- clipping 的完整视锥六面裁剪
- 三角形光栅化
- barycentric coordinates
- shader pipeline
- GPU / WebGL / WebGPU

所以推荐把它当成“理解渲染管线前半段”的项目：坐标、变换、投影、裁剪、排序、绘制。学完后，再继续补光栅化、深度缓冲、光照、纹理和 shader。

## 需要掌握的数学知识和公式

### 1. 三角函数

需要知道 `sin`、`cos`、`tan`，尤其是旋转和透视相机里会用到。

常见公式：

```txt
sin(theta)
cos(theta)
tan(theta) = opposite / adjacent
```

项目里的 `PerspectiveCamera` 使用：

```txt
scale = tan(fov / 2)
x_ndc = x / (z * scale * aspect)
y_ndc = y / (z * scale)
```

直觉是：`z` 越大，除出来的 `x_ndc`、`y_ndc` 越小，所以远处物体看起来更小。

相关源码：

- `src/core/scene/perspective-camera.ts`
- `src/core/math/mat4.ts`

Wiki：

- [Trigonometric functions](https://en.wikipedia.org/wiki/Trigonometric_functions)
- [Field of view](https://en.wikipedia.org/wiki/Field_of_view)
- [Perspective projection](https://en.wikipedia.org/wiki/3D_projection#Perspective_projection)

### 2. 向量

需要知道向量表示方向和位移，不只是点。

常见公式：

```txt
a + b = (ax + bx, ay + by, az + bz)
a - b = (ax - bx, ay - by, az - bz)
s * a = (s * ax, s * ay, s * az)
|a| = sqrt(ax^2 + ay^2 + az^2)
normalize(a) = a / |a|
```

点积：

```txt
dot(a, b) = ax * bx + ay * by + az * bz
dot(a, b) = |a| * |b| * cos(theta)
```

点积后续可用于判断两个方向是否同向、计算光照强度、判断面是否朝向相机。

叉积：

```txt
cross(a, b) = (
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx
)
```

叉积后续可用于算法线、背面剔除和三角形方向。

相关源码：

- `src/core/math/vec3.ts`

Wiki：

- [Euclidean vector](https://en.wikipedia.org/wiki/Euclidean_vector)
- [Dot product](https://en.wikipedia.org/wiki/Dot_product)
- [Cross product](https://en.wikipedia.org/wiki/Cross_product)

### 3. 矩阵和齐次坐标

3D 渲染常用 4x4 矩阵统一表示平移、旋转、缩放和投影。

普通 3D 点：

```txt
(x, y, z)
```

齐次坐标：

```txt
(x, y, z, w)
```

通常把普通点当作：

```txt
(x, y, z, 1)
```

投影后如果 `w` 不是 1，需要做透视除法：

```txt
x' = x / w
y' = y / w
z' = z / w
```

项目使用 column-major 4x4 matrix，和 OpenGL/WebGL 常见内存布局一致。矩阵乘法里：

```txt
M = T * R * S
```

在列向量约定下，实际作用到点上的顺序是：

```txt
先 scale，再 rotation，最后 translation
```

相关源码：

- `src/core/math/mat4.ts`
- `src/core/scene/object3d.ts`

Wiki：

- [Matrix multiplication](https://en.wikipedia.org/wiki/Matrix_multiplication)
- [Transformation matrix](https://en.wikipedia.org/wiki/Transformation_matrix)
- [Homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates)
- [Row- and column-major order](https://en.wikipedia.org/wiki/Row-_and_column-major_order)

### 4. 旋转矩阵

绕 x 轴旋转：

```txt
x' = x
y' = y * cos(theta) - z * sin(theta)
z' = y * sin(theta) + z * cos(theta)
```

绕 y 轴旋转：

```txt
x' = x * cos(theta) + z * sin(theta)
y' = y
z' = -x * sin(theta) + z * cos(theta)
```

绕 z 轴旋转：

```txt
x' = x * cos(theta) - y * sin(theta)
y' = x * sin(theta) + y * cos(theta)
z' = z
```

项目没有单独写点级旋转函数，而是把这些公式放进 4x4 旋转矩阵中。

相关源码：

- `src/core/math/mat4.ts`
- `src/core/scene/object3d.ts`

Wiki：

- [Rotation matrix](https://en.wikipedia.org/wiki/Rotation_matrix)
- [Euler angles](https://en.wikipedia.org/wiki/Euler_angles)

### 5. 坐标系和坐标空间

阅读渲染代码时，最重要的是分清当前点在哪个空间：

```txt
model/local space
  -> world space
  -> camera/view space
  -> clip / normalized space
  -> viewport / screen space
```

本项目里：

- OBJ 顶点最开始在模型局部空间。
- `Object3D.localMatrix` 把局部空间变到世界空间。
- `PerspectiveCamera` 当前只用相机位置做世界空间到相机空间转换，还没有相机旋转。
- `projectPoint` 把相机空间点透视投影到标准化 2D 坐标。
- `mapToViewport` 把标准化坐标映射到 Canvas 像素坐标。

相关源码：

- `src/core/render/pipeline.ts`
- `src/core/scene/perspective-camera.ts`
- `src/core/viewport.ts`

Wiki：

- [Cartesian coordinate system](https://en.wikipedia.org/wiki/Cartesian_coordinate_system)
- [Camera matrix](https://en.wikipedia.org/wiki/Camera_matrix)
- [Viewing frustum](https://en.wikipedia.org/wiki/Viewing_frustum)

### 6. 裁剪和线性插值

near-plane 裁剪会处理“一个面有些点在相机前方，有些点太靠近或在相机后方”的情况。

项目里的交点计算使用线性插值：

```txt
t = (near - currentZ) / (nextZ - currentZ)
intersection = current + t * (next - current)
```

其中 `t` 表示从当前点走到下一个点的比例。

相关源码：

- `src/core/scene/perspective-camera.ts`

Wiki：

- [Line clipping](https://en.wikipedia.org/wiki/Line_clipping)
- [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm)
- [Linear interpolation](https://en.wikipedia.org/wiki/Linear_interpolation)

### 7. 深度排序

Canvas 2D 没有 3D 深度缓冲。谁后画，谁盖住前面已经画好的内容。

本项目使用画家算法：

```txt
faceDepth = average(vertex.z)
先画 z 更大的远面
再画 z 更小的近面
```

这对简单凸模型和入门 demo 很直观，但不是通用正确算法。互相穿插的多边形、复杂模型、自相交模型会出错。真正的实时 3D 渲染通常使用 z-buffer。

相关源码：

- `src/core/mesh.ts`
- `src/core/render/pipeline.ts`
- `src/render.ts`

Wiki：

- [Painter's algorithm](https://en.wikipedia.org/wiki/Painter%27s_algorithm)
- [Z-buffering](https://en.wikipedia.org/wiki/Z-buffering)

## 当前代码的渲染流程

完整流程可以按下面理解：

```txt
index.html
  -> src/demo/index.ts
  -> 加载 OBJ 文件
  -> parseObjMesh(source)
  -> new MeshObject(mesh)
  -> scene.add(object)
  -> 每帧更新 object.position / rotation / scale
  -> Canvas3DRenderer.render(scene, camera)
  -> createRenderCommands(scene, camera, viewport)
  -> object.localMatrix
  -> transformPointMat4(localMatrix, vertex)
  -> sortFacesByDepth(faces, transformedVertices)
  -> camera.clipNearFace(faceVertices)
  -> camera.projectPoint(vertex, viewport)
  -> RenderCommand[]
  -> Canvas 2D fill / stroke
```

更具体地说：

1. `src/demo/index.ts` 创建 `Scene`、`PerspectiveCamera` 和 `Canvas3DRenderer`。
2. `loadObj` 使用浏览器 `fetch` 读取 `models/cube.obj` 和 `models/teapot.obj`。
3. `parseObjMesh` 解析 OBJ 的 `v` 顶点行和 `f` 面行，生成 `Mesh`。
4. `MeshObject` 把 mesh 和 `position / rotation / scale` 放在一起。
5. 每一帧 `frame()` 修改 cube / teapot 的位置和旋转。
6. `Canvas3DRenderer.render` 调用 core 层的 `createRenderCommands`。
7. `createRenderCommands` 遍历场景里的 mesh object。
8. 每个局部顶点通过 `object.localMatrix` 转成世界坐标。
9. 每个面用平均 z 值做深度排序。
10. 面先经过 camera near-plane 裁剪。
11. 裁剪后的 3D 顶点再被 `projectPoint` 投影成屏幕像素坐标。
12. core 层输出不依赖 Canvas 的 `RenderCommand[]`。
13. `src/render.ts` 把每个 face command 变成 Canvas 2D 的 `fill()` 和 `stroke()`。

这一套设计有一个清楚边界：

- `src/core` 是可测试、可复用的渲染核心，不依赖 DOM 和 Canvas。
- `src/render.ts` 是 Canvas 2D 适配层。
- `src/demo/index.ts` 是基础 demo 和浏览器生命周期。
- `src/graph/app.ts` 是关系图谱页面入口，它复用相机投影，但节点使用 Canvas 2D billboard 绘制。

## 关系图谱流程

`graph.html` 展示的是另一条学习路线：不再渲染 OBJ mesh，而是把 3D 坐标投影成屏幕上的球形节点。

```txt
graph.html
  -> src/graph/app.ts
  -> createEntryGraph()
  -> createGraphPhysics(nodes, links)
  -> physics.step(dt)
  -> PerspectiveCamera.projectPoint(position)
  -> drawLinks()
  -> drawSpheres()
  -> drawLabels()
```

这条流程里有几个重点：

1. `src/graph/data.ts` 只负责数据。当前默认是 `index.html` 和 `graph.html` 两个入口的项目结构图。
2. `src/graph/physics.ts` 只负责物理状态。它不知道 Canvas，也不知道 DOM。
3. `src/graph/app.ts` 负责把物理坐标投影成屏幕坐标，再画线、球、标签和 inspector。
4. graph 节点不是 `MeshObject`，而是 billboard：它有 3D 位置，但最终用 Canvas 圆形渐变画出来。
5. `Canvas3DRenderer.render(scene, camera)` 在 graph 页面里主要用于清屏；真正的图谱元素是叠加绘制。

### 图谱物理的学习点

图谱物理不是 3D 引擎自带的能力，而是额外的一层 simulation：

- **弹簧力**：每条边记录初始长度，拖拽后会尝试把两个端点拉回这个距离。
- **锚点力**：每个节点记住初始位置，持续受到一个很弱的回拉力。
- **阻尼**：速度每帧乘以一个小于 1 的系数，避免永远震荡。
- **排斥力**：距离太近的节点互相推开，减少重叠。
- **空间网格**：排斥力不再全量两两比较，而是只检查相邻格子里的节点。

空间网格优化的直觉：

```txt
没有空间网格:
  每个节点和所有其他节点比较
  复杂度约 O(n^2)

有空间网格:
  先按坐标把节点放进格子
  每个节点只检查附近格子
  分散情况下接近 O(n)
```

这不是最强的图谱算法，但很适合学习项目：代码短，效果直观，也能解释为什么大规模图谱需要空间索引或 WebGL。

## 代码阅读顺序

### 第一遍：先看数据结构

先读：

- `src/core/types.ts`
- `src/core/math/vec3.ts`
- `src/core/math/mat4.ts`

目标：

- 明白一个 mesh 是 `vertices + faces`。
- 明白 face 只保存顶点索引，不复制顶点。
- 明白 Vec3 是所有 3D 点和方向的基础。
- 明白 Mat4 使用 column-major 布局。

配套测试：

- `__test__/vec3.test.ts`
- `__test__/mat4.test.ts`

### 第二遍：看一个对象如何动起来

再读：

- `src/core/scene/object3d.ts`
- `src/core/scene/mesh-object.ts`
- `src/core/scene/scene.ts`

目标：

- 明白 `Object3D` 只负责空间变换。
- 明白 `MeshObject` 是带 mesh 的对象。
- 明白 `Scene` 只是对象容器。
- 明白 `localMatrix = T * R * S`。

配套测试：

- `__test__/object3d.test.ts`
- `__test__/mesh-object.test.ts`
- `__test__/scene.test.ts`

### 第三遍：看模型文件如何变成 mesh

再读：

- `src/core/loaders/obj.ts`
- `models/cube.obj`
- `models/teapot.obj`

目标：

- 明白 OBJ 里的 `v x y z` 是顶点。
- 明白 OBJ 里的 `f a b c` 是面，索引从 1 开始。
- 明白 loader 把 OBJ 索引转换成 TypeScript 数组的 0-based index。

配套测试：

- `__test__/obj-loader.test.ts`

Wiki：

- [Wavefront .obj file](https://en.wikipedia.org/wiki/Wavefront_.obj_file)

### 第四遍：看相机和投影

再读：

- `src/core/scene/perspective-camera.ts`
- `src/core/viewport.ts`

目标：

- 明白当前相机朝 `+z` 方向看。
- 明白 `cameraZ <= near` 或 `cameraZ >= far` 的点会被丢掉。
- 明白 `x / z` 和 `y / z` 是近大远小的核心。
- 明白 viewport 映射会把标准化坐标转换成像素坐标，并翻转 y 轴。

配套测试：

- `__test__/perspective-camera.test.ts`

### 第五遍：看核心渲染管线

再读：

- `src/core/render/commands.ts`
- `src/core/render/pipeline.ts`
- `src/core/mesh.ts`

目标：

- 明白 core 不画图，只输出 `RenderCommand[]`。
- 明白 pipeline 的输入是 `Scene + Camera + Viewport`。
- 明白每个面如何经历 transform、sort、clip、project。
- 明白画家算法为什么要从远到近排序。

配套测试：

- `__test__/pipeline.test.ts`
- `__test__/triangle-face.test.ts`
- `__test__/render.test.ts`

### 第六遍：看 Canvas 适配层和 demo

最后读：

- `src/render.ts`
- `src/demo/index.ts`
- `index.html`
- `src/constants.ts`

目标：

- 明白 Canvas 只是最后的绘制目标。
- 明白 `ctx.scale(dpr, dpr)` 是为了高分屏清晰。
- 明白动画循环每帧只更新对象状态，再重新渲染整个场景。
- 明白 `setTimeout` 可以替换成更适合浏览器动画的 `requestAnimationFrame`。

### 第七遍：看关系图谱层

再读：

- `graph.html`
- `src/graph/data.ts`
- `src/graph/physics.ts`
- `src/graph/app.ts`

目标：

- 明白同一个项目可以有多个 HTML 入口。
- 明白 `index.html` 和 `graph.html` 的入口逻辑互不干扰。
- 明白 graph 页面如何复用 `PerspectiveCamera.projectPoint`。
- 明白 billboard 节点为什么比 mesh 节点更适合大量图谱节点。
- 明白空间网格为什么能减少排斥力计算次数。

## 一张总图

```txt
OBJ file
  |
  v
parseObjMesh
  |
  v
Mesh(vertices, faces)
  |
  v
MeshObject(position, rotation, scale)
  |
  v
Object3D.localMatrix
  |
  v
local vertices -> world vertices
  |
  v
face depth sort
  |
  v
near-plane clipping
  |
  v
perspective projection
  |
  v
viewport mapping
  |
  v
RenderCommand[]
  |
  v
Canvas fill / stroke
```

## 推荐学习路径

1. 跑通项目，确认能看到 cube 和 teapot。
2. 改 `src/demo/index.ts` 里的 `position`、`rotation`、`scale`，观察屏幕变化。
3. 给 `vec3.ts` 和 `mat4.ts` 的每个函数配一个手算例子。
4. 在 `perspective-camera.ts` 打印 `cameraX / cameraY / cameraZ`，观察投影前后的数值。
5. 暂时关闭 `sortFacesByDepth`，观察面遮挡为什么会错。
6. 暂时关闭 `clipNearFace`，把模型移近相机，观察投影异常。
7. 添加 back-face culling，用叉积和点积跳过背对相机的面。
8. 添加一个简单 directional light，用法线和光线方向的点积控制颜色亮度。
9. 实现 z-buffer，替换画家算法。
10. 实现三角形光栅化和 barycentric interpolation。
11. 再去学 WebGL/WebGPU，把这里的 CPU 管线映射到 GPU pipeline。
12. 打开 `graph.html`，拖动入口节点，观察弹簧、锚点和阻尼的效果。
13. 把 `createEntryGraph()` 临时改成 `createStressGraph(128)`，观察节点数变多后的性能变化。

## 后续应该补的知识

如果目标是“学好 3D 渲染”，这个项目之后建议继续学：

- 光栅化：三角形如何变成像素。
- Barycentric coordinates：如何在三角形内部插值深度、颜色、UV。
- Depth buffer：如何逐像素解决遮挡。
- Back-face culling：如何跳过背向相机的三角形。
- Clipping：如何完整裁剪视锥外的几何。
- Normal vector：如何描述面的朝向。
- Lambert lighting：最基础的漫反射光照。
- Phong / Blinn-Phong：高光模型。
- Texture mapping：如何用 UV 贴图。
- Gamma correction：颜色空间为什么会影响最终观感。
- Shader：顶点着色器和片元着色器的职责。
- WebGL / WebGPU pipeline：GPU 版本的完整渲染流程。

对应 Wiki：

- [Rasterisation](https://en.wikipedia.org/wiki/Rasterisation)
- [Barycentric coordinate system](https://en.wikipedia.org/wiki/Barycentric_coordinate_system)
- [Back-face culling](https://en.wikipedia.org/wiki/Back-face_culling)
- [Surface normal](https://en.wikipedia.org/wiki/Normal_(geometry))
- [Lambertian reflectance](https://en.wikipedia.org/wiki/Lambertian_reflectance)
- [Phong reflection model](https://en.wikipedia.org/wiki/Phong_reflection_model)
- [Texture mapping](https://en.wikipedia.org/wiki/Texture_mapping)
- [Gamma correction](https://en.wikipedia.org/wiki/Gamma_correction)
- [Shader](https://en.wikipedia.org/wiki/Shader)
- [Graphics pipeline](https://en.wikipedia.org/wiki/Graphics_pipeline)
- [WebGL](https://en.wikipedia.org/wiki/WebGL)
- [WebGPU](https://en.wikipedia.org/wiki/WebGPU)
