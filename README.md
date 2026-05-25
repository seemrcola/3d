# 3D Wireframe Cube
@tsoding 从tsoding那里学到的一点新知识。

一个用 TypeScript 和 Canvas 手写的最小 3D 线框立方体渲染项目。

这个项目没有使用 Three.js 之类的 3D 引擎，而是自己完成一条简单的 3D 渲染流水线：

```txt
3D 顶点
  -> model matrix 变换
  -> 透视投影成 2D 坐标
  -> 转换成 Canvas 像素坐标
  -> 按深度排序并绘制彩色面
```

适合用来理解 3D 图形里最核心的几个概念：坐标、旋转、深度、透视投影、屏幕映射和逐帧渲染。

## 效果

页面会在 `canvas` 上绘制一个彩色面立方体。每一帧里，demo 会更新 `MeshObject` 的旋转，再通过 `Canvas3DRenderer.render(scene, camera)` 渲染整个场景。

## 技术栈

- TypeScript
- Canvas 2D API
- Bun

## 项目结构

```txt
.
├── index.html          # 页面入口，挂载 canvas 并加载 src/index.ts
├── package.json        # Bun / TypeScript 项目配置
├── tsconfig.json       # TypeScript 编译检查配置
├── __test__            # 集中的 Bun 测试文件
└── src
    ├── core            # 不依赖 DOM / Canvas 的 3D 引擎核心
    │   ├── index.ts    # core 公共导出
    │   ├── math        # Vec3 / Mat4 等基础数学
    │   │   ├── index.ts
    │   │   ├── mat4.ts # 4x4 矩阵、矩阵乘法、点变换、透视矩阵
    │   │   └── vec3.ts # 3D 向量加减、缩放、点乘、叉乘、归一化
    │   ├── mesh.ts     # 面深度计算和画家算法排序
    │   ├── projection.ts # 透视投影：3D 坐标 -> 2D 坐标
    │   ├── render
    │   │   ├── commands.ts # 不依赖 Canvas 的绘制命令类型
    │   │   ├── index.ts
    │   │   └── pipeline.ts # Scene + Camera + Viewport -> RenderCommand[]
    │   ├── scene
    │   │   ├── index.ts
    │   │   ├── mesh-object.ts # 带 mesh 数据的 3D 对象
    │   │   ├── object3d.ts # position / rotation / scale -> localMatrix
    │   │   ├── perspective-camera.ts # MVP 透视相机
    │   │   └── scene.ts # 场景对象容器
    │   ├── transform.ts  # 3D 变换：z 轴平移、绕 x/y 轴旋转
    │   ├── types.ts    # Point、Point3D、Face、Mesh、Viewport
    │   ├── viewport.ts # 标准化 2D 坐标 -> viewport 像素坐标
    │   └── primitives
    │       └── cube.ts # 内置 cube mesh 数据
    ├── constants.ts    # demo 画布尺寸、颜色、FPS 和线宽
    ├── index.ts        # demo 入口，负责 canvas 初始化和动画循环
    └── render.ts       # Canvas3DRenderer：Canvas 2D 适配层
```

## Core 边界

现在已经抽出来的 `src/core` 是这个项目里最接近“3D 渲染引擎”的部分，它不依赖浏览器 DOM，也不依赖 Canvas API：

- `types.ts`：引擎最基础的数据结构，包含 2D/3D 点、面、网格和 viewport。
- `math/vec3.ts`：3D 向量数学，包含加减、缩放、点乘、叉乘、长度和归一化。
- `math/mat4.ts`：4x4 矩阵数学，包含 identity、平移、旋转、缩放、矩阵乘法、点变换和透视投影矩阵。
- `scene/object3d.ts`：基础 3D 对象，持有 position、rotation、scale，并生成 localMatrix。
- `scene/mesh-object.ts`：带 mesh 数据的 3D 对象，目前用于把 cube 的几何数据和 transform 状态放到一起。
- `scene/scene.ts`：场景容器，负责管理要渲染的对象。
- `scene/perspective-camera.ts`：MVP 透视相机，目前看向正 z 方向，负责把世界点投影到 viewport。
- `render/pipeline.ts`：核心渲染管线，把 `Scene + PerspectiveCamera + Viewport` 转成不依赖 Canvas 的 `RenderCommand[]`。
- `transform.ts`：点级别的 3D 变换，目前有 z 轴平移、绕 y 轴旋转、绕 x 轴旋转。
- `projection.ts`：最小透视投影，把 3D 点变成标准化 2D 点。
- `viewport.ts`：把标准化 2D 点映射到任意 viewport 像素坐标。
- `mesh.ts`：网格面相关算法，目前包含按平均深度排序的画家算法。
- `primitives/cube.ts`：内置的第一个 mesh primitive，后续可以继续增加 plane、sphere、custom mesh loader。

还留在 core 外面的逻辑是 demo 或平台适配层：

- `src/index.ts`：浏览器 canvas 初始化、DPR 处理、动画状态和帧循环。
- `src/render.ts`：`Canvas3DRenderer`，把 core render commands 真正画到 Canvas 2D 上。
- `src/constants.ts`：demo 的画布尺寸、颜色、FPS 和线宽。

## 运行项目

安装依赖：

```bash
bun install
```

启动本地页面：

```bash
bun index.html
```

Bun 会启动一个本地开发服务器，默认地址通常是：

```txt
http://localhost:3000/
```

打开这个地址即可看到 canvas 画面。

## 验证

运行 TypeScript 类型检查：

```bash
bunx tsc --noEmit
```

如果之后添加了 `*.test.ts` 或 `*.spec.ts` 测试文件，可以用下面的命令运行测试：

```bash
bun test
```

## 核心流程

主流程在 `src/index.ts` 里。demo 先创建 scene、cube、camera 和 renderer：

```ts
const scene = new Scene()
const cube = new MeshObject(CUBE_MESH)
const camera = new PerspectiveCamera({
  fov: Math.PI / 2,
  aspect: CANVAS_WIDTH / CANVAS_HEIGHT,
  near: 0.1,
  far: 100
})
const renderer = new Canvas3DRenderer(ctx, {
  backgroundColor: BACKGROUND_COLOR,
  outlineColor: FOREGROUND_COLOR,
  outlineWidth: LINE_WIDTH,
  viewport: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
})

scene.add(cube)
```

每一帧只更新对象状态，然后调用 renderer：

```ts
cube.position = vec3(0, 0, 2)
cube.rotation = vec3(angle, angle, 0)
renderer.render(scene, camera)
```

`Canvas3DRenderer` 内部会调用 core render pipeline：遍历 scene 中的 mesh，使用对象的 `localMatrix` 变换顶点，使用 camera 投影到 viewport，按深度排序后输出绘制命令，最后把这些命令画到 Canvas 2D。

## 坐标和投影

项目里有两种坐标：

- `Point3D`：三维世界坐标，包含 `x`、`y`、`z`
- `Point`：二维坐标，包含 `x`、`y`

MVP 里实际渲染使用的是 `src/core/scene/perspective-camera.ts`。它会把点先转换到相机相对坐标，再做透视投影和 viewport 映射。`src/core/projection.ts` 里仍保留了最小点级透视函数，便于教学和低层测试：

```ts
return { x: x / z, y: y / z }
```

这个公式的直觉是：`z` 越大，点越远；同样的 `x` 和 `y` 除以更大的 `z` 后会变小，所以远处的物体看起来更小。

viewport 映射在 `src/core/viewport.ts` 里，负责把 `-1` 到 `1` 附近的投影坐标转换成像素坐标。Canvas 的 y 轴向下增长，而数学坐标里的 y 轴通常向上增长，所以这里也会翻转 y 轴。

## 延伸阅读

- [3D projection](https://en.wikipedia.org/wiki/3D_projection)：透视投影为什么能把 3D 点映射到 2D 平面。
- [Perspective (graphical)](https://en.wikipedia.org/wiki/Perspective_(graphical))：近大远小的视觉规律。
- [Transformation matrix](https://en.wikipedia.org/wiki/Transformation_matrix)：平移、旋转、缩放为什么可以统一成矩阵乘法。
- [Homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates)：为什么 3D 渲染里常用 `(x, y, z, w)`。
- [Painter's algorithm](https://en.wikipedia.org/wiki/Painter%27s_algorithm)：当前项目按深度排序绘制面的思路。
- [Canvas API](https://en.wikipedia.org/wiki/Canvas_element)：HTML canvas 和 Canvas 2D 绘制上下文的背景。

## 立方体数据

立方体由两部分组成：

- `CUBE_VERTICES`：8 个顶点
- `CUBE_FACES`：6 个面

`CUBE_FACES` 里的每一项都是四个顶点下标和一个颜色。渲染时会先用这四个顶点填充面，再沿这四个顶点闭合连线，所以不再需要单独维护 `CUBE_EDGES`。

## 后续可以尝试

- 用 `requestAnimationFrame` 替换 `setTimeout`，让动画更贴合浏览器刷新率
- 增加 `Material`，把颜色从 `Face` 拆出来
- 增加 `Renderer.render(scene, camera)` 的更多目标，例如 SVG renderer
- 给 `PerspectiveCamera` 增加旋转和 view matrix
- 增加 back-face culling，跳过背向相机的面
- 增加 near-plane clipping，处理面穿过相机近裁剪面的情况
