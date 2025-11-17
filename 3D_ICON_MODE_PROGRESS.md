# 3D 图标模式（Icon Mode）实现进度文档

**项目名称**: BuildingMomo - 家具编辑工具  
**功能模块**: 3D 场景中的图标显示模式  
**目标**: 为复杂场景（2000-10000 个物品）提供高性能的图标视图交互，与正交视图深度集成  
**文档更新时间**: 2025-11-17

---

## 📋 整体目标

在现有的 3D Box 模式（完整体积渲染）基础上，新增 Icon 模式（平面图标渲染），用于：
- **复杂场景优化**: 替代体积碰撞检测，使用简化的平面碰撞，提升大场景选中体验
- **正交视图友好**: 顶视图、前视图等正交投影下自动切换为图标模式
- **高性能**: 使用 Three.js InstancedMesh 批量渲染，支持 2000-10000+ 物品
- **无缝切换**: Box 和 Icon 模式在 UI 和互动上完全无缝切换

---

## ✅ 已完成任务（Phase 1 - 基础架构）

### 1. 设置系统扩展
**文件**: `src/stores/settingsStore.ts`  
**变更**:
- 扩展 `AppSettings` 接口，新增两项配置：
  - `threeDisplayMode: 'box' | 'icon'` - 3D 显示模式选择（默认 'box'）
  - `threeIconModeInOrthographic: boolean` - 正交视图下是否自动使用图标模式（默认 true）
- 更新 `DEFAULT_SETTINGS` 设置默认值
- 配置自动持久化到 localStorage（使用 VueUse 的 `useLocalStorage`）

**验证方式**: 检查浏览器开发工具 > Application > localStorage，确保配置被保存

### 2. 设置对话框 UI
**文件**: `src/components/SettingsDialog.vue`  
**变更**:
- 在"显示设置" Tab 中新增"3D 视图"分组
- 添加两个交互控件：
  - **3D 视图显示模式** (Switch): 在立方体/图标间切换
  - **正交视图自动使用图标模式** (Switch): 开启/关闭正交视图自动切换

**用户流程**:
1. 打开设置对话框 (Ctrl+,)
2. 进入"显示设置" Tab
3. 在"3D 视图"分组中调整偏好
4. 修改即时生效，配置自动保存

### 3. 纹理管理器
**文件**: `src/composables/useThreeIconTextureManager.ts` (新建)  
**职责**: 管理 Three.js 纹理的加载、缓存和转换  
**关键特性**:
- **单例模式**: 通过 `getThreeIconTextureManager()` 获取全局实例
- **占位符纹理**: Canvas 生成渐变 + "?" 符号的默认纹理，用于未加载或无图标的物品
- **异步加载**: 利用已有的 `getIconLoader()` 获取 2D 图标，转换为 Three.js Texture
- **缓存管理**: 纹理缓存 Map，支持 `dispose()` 释放资源

**当前阶段**: 所有物品暂时使用占位符纹理  
**后续集成**: 待 Phase 2 接入真实图标纹理（按图标分组或纹理图集）

**API 提供**:
```typescript
// 异步加载纹理（后续使用）
loadTexture(itemId: number): Promise<Texture>

// 批量预加载（视图加载时调用）
preloadTextures(itemIds: number[]): Promise<void>

// 同步获取已缓存纹理（渲染时调用）
getTexture(itemId: number): Texture

// 清理资源
dispose(): void
```

### 4. 渲染器扩展 - Icon InstancedMesh
**文件**: `src/composables/useThreeInstancedRenderer.ts` (扩展)  
**新增内容**:

#### 4.1 Icon 几何体和材质
```typescript
// PlaneGeometry: 固定大小 180x180 游戏单位
planeGeometry = new PlaneGeometry(180, 180)

// MeshBasicMaterial: 不需要光照，性能更优
iconMaterial = new MeshBasicMaterial({
  map: placeholderTexture,          // 占位符或实际图标
  transparent: true,
  alphaTest: 0.5,                   // 半透明像素阈值
  depthWrite: false,                // 避免深度排序问题
})

// InstancedMesh: 与 Box 模式同数量
iconInstancedMesh = new InstancedMesh(planeGeometry, iconMaterial, MAX_INSTANCES)
```

#### 4.2 核心更新函数
所有现有的实例更新函数都已同步更新 Icon mesh：

| 函数 | 职责 | Icon 特殊处理 |
|------|------|--------------|
| `rebuildInstances()` | 重建所有实例（物品集合变化时） | Icon 使用固定尺寸 (1,1,1)，无旋转，初始朝向为 +Y (0, 1, 0) |
| `updateInstancesColor()` | 刷新实例颜色（选中/hover 变化） | 同步更新两个 mesh 的 instanceColor |
| `updateInstanceColorById()` | 单个物品颜色更新（hover） | 同步更新两个 mesh |
| `updateSelectedInstancesMatrix()` | 拖拽时更新位置 | Box 更新完整矩阵，Icon 仅更新位置 |

#### 4.3 新增 API：Icon 朝向控制
```typescript
updateIconFacing(normal: [number, number, number]): void
```
- 用途: 批量更新所有图标的朝向，使其法线指向指定方向
- 使用场景: 
  - 正交视图切换 (top/front/left/right 等) 时
  - 透视视图下若需要 Billboard 效果时
- 实现: 计算从 +Z 轴指向目标法线的旋转四元数，应用于所有实例

**返回值扩展**:
```typescript
return {
  instancedMesh,            // Box InstancedMesh (ref)
  iconInstancedMesh,        // Icon InstancedMesh (ref) ✨ 新增
  indexToIdMap,
  idToIndexMap,
  updateSelectedInstancesMatrix,
  setHoveredItemId,
  updateIconFacing          // ✨ 新增
}
```

### 5. ThreeEditor.vue 集成
**文件**: `src/components/ThreeEditor.vue` (扩展)  
**变更**:

#### 5.1 模式判断逻辑
```typescript
// 根据设置 + 当前视图投影，动态计算显示模式
currentDisplayMode = computed(() => {
  if (settingsStore.settings.threeIconModeInOrthographic && isOrthographic.value) {
    return 'icon'  // 正交视图自动切换到 icon
  }
  return settingsStore.settings.threeDisplayMode  // 用户手动设置的模式
})

shouldShowBoxMesh = computed(() => currentDisplayMode.value === 'box')
shouldShowIconMesh = computed(() => currentDisplayMode.value === 'icon')
```

#### 5.2 拾取对象动态切换
```typescript
// 确保选择和 Tooltip 使用当前显示的 InstancedMesh
pickInstancedMesh = computed(() => 
  shouldShowIconMesh.value ? iconInstancedMesh.value : instancedMesh.value
)

// 传入 useThreeSelection 和 useThreeTooltip
useThreeSelection(editorStore, activeCameraRef, {
  instancedMesh: pickInstancedMesh,  // 动态
  indexToIdMap
}, ...)

useThreeTooltip(editorStore, furnitureStore, activeCameraRef, threeContainerRef, {
  instancedMesh: pickInstancedMesh,  // 动态
  indexToIdMap
}, ...)
```

#### 5.3 模板渲染
```vue
<!-- 按显示模式条件渲染 -->
<primitive v-if="shouldShowBoxMesh && instancedMesh" :object="instancedMesh" />
<primitive v-if="shouldShowIconMesh && iconInstancedMesh" :object="iconInstancedMesh" />
```

#### 5.4 Icon 朝向同步
```typescript
// 监听视图 + 模式变化，更新图标朝向
watch([() => currentDisplayMode.value, () => currentViewPreset.value], ([mode, preset]) => {
  if (mode !== 'icon') return
  
  let normal: [number, number, number]
  switch (preset) {
    case 'top': normal = [0, 1, 0]; break
    case 'bottom': normal = [0, -1, 0]; break
    case 'front': normal = [0, 0, 1]; break
    case 'back': normal = [0, 0, -1]; break
    case 'right': normal = [1, 0, 0]; break
    case 'left': normal = [-1, 0, 0]; break
    case 'perspective':
    default:
      // 透视视图：使用相机方向
      const pos = cameraPosition.value
      const target = cameraLookAt.value
      normal = [pos[0] - target[0], pos[1] - target[1], pos[2] - target[2]]
      break
  }
  updateIconFacing(normal)
}, { immediate: true })
```

---

## 🧪 测试验证清单

### 基础功能验证
- [ ] 打开 3D 视图，默认显示 Box 模式
- [ ] 打开设置，进入"显示设置" > "3D 视图"
- [ ] 切换"3D 视图显示模式"开关，确保 Box/Icon 在场景中切换
- [ ] 切换到正交视图（顶/前/侧），若启用自动切换，应自动显示 Icon
- [ ] 切换到透视视图，应恢复为用户设置的模式

### 交互验证
- [ ] Icon 模式下能正常点击选中物品
- [ ] Icon 模式下能框选多个物品
- [ ] Icon 模式下悬停时 Tooltip 正常显示
- [ ] Icon 模式下选中物品能正常拖拽移动
- [ ] Icon 模式下选中状态（蓝色）和 hover 状态（橙色）正确显示

### 视图转换验证
- [ ] 正交视图间（top/front/left/right）切换时，图标朝向正确
- [ ] 透视视图和正交视图间切换，模式和朝向都正确
- [ ] 在 Icon 模式下改变正交视图预设，图标应重新朝向

### 性能验证
- [ ] 加载 2000+ 物品场景，Icon 模式帧率稳定（>30 FPS）
- [ ] Box → Icon 切换顺畅，无卡顿
- [ ] 选中/框选时响应迅速

---

## ⏳ 待完成任务（Phase 2 - 真实图标集成）

### Phase 2A: 按图标分组渲染（推荐方案 - 相对简单）

**目标**: 将物品按图标类型分组，每组用独立的 InstancedMesh + 该图标纹理

**步骤**:
1. **统计物品图标分布**
   - 遍历所有物品，收集 gameId 及对应图标
   - 计算哪些图标在当前可见物品中出现过
   
2. **生成分组 InstancedMesh**
   - 对每个唯一的图标创建一个 InstancedMesh：
     ```typescript
     const iconTexture = await textureManager.loadTexture(gameId)
     const material = new MeshBasicMaterial({ map: iconTexture, ... })
     const groupMesh = new InstancedMesh(planeGeometry, material, groupSize)
     groupMeshes.set(gameId, groupMesh)
     ```
   - 在父容器中批量添加所有 groupMesh

3. **更新索引映射**
   - 除了 `indexToIdMap` 外，新增 `itemIdToGroupKey` 映射
   - 当物品ID → 找到对应gameId → 找到对应groupMesh 及其内部index

4. **同步更新机制**
   - `rebuildInstances()` 需重新分组和分配矩阵
   - 颜色更新仍按 itemId 查找对应的 groupMesh 中的实例

**优点**: 
- 逻辑清晰，易于调试
- 每个物品用真实图标纹理
- 支持图标个数增长（动态分组）

**缺点**: 
- 多个 InstancedMesh 意味着多次 GPU drawcall
- 图标数多时性能会下降（但图标通常远少于物品数）

**文件修改**:
- `src/composables/useThreeInstancedRenderer.ts` - 重构整个 Icon 管理逻辑
- `src/composables/useThreeIconTextureManager.ts` - 需要预加载所有可见物品的图标纹理

**预计工作量**: 1-1.5 天

---

### Phase 2B: 纹理图集 (Texture Atlas) 方案（高级方案 - 较复杂）

**目标**: 所有图标合并成一个大纹理（如 2048x2048），使用 UV 偏移来选择不同图标

**步骤**:
1. **离线或运行时生成图集**
   - 加载所有可见物品的图标
   - 使用 Canvas 或第三方库（如 `bin-pack`）排列成矩形
   - 生成大纹理和 UV 映射表

2. **使用自定义 Attribute**
   - 为 PlaneGeometry 添加自定义 Attribute：`uv_offset` (x, y, width, height)
   - 在 Fragment Shader 中动态计算纹理采样坐标

3. **单个 InstancedMesh**
   - 所有物品共用一个 InstancedMesh
   - 通过 Shader 中的 UV 偏移实现不同图标显示

**优点**:
- 最优性能：单个 drawcall，单个纹理
- 支持 10000+ 物品无压力

**缺点**:
- 需要自定义 Shader 代码
- 调试难度较高
- 纹理图集维护复杂（图标增删需重新生成）

**文件新增/修改**:
- `src/composables/useThreeAtlasBuilder.ts` (新建) - 图集生成器
- `src/shaders/icon.vert` / `icon.frag` (新建) - 自定义着色器
- `src/composables/useThreeInstancedRenderer.ts` - 适配图集逻辑

**预计工作量**: 2-3 天

---

### 推荐实施顺序

1. **先做 Phase 2A**（按图标分组）：
   - 逻辑简单，易于上手
   - 能立即看到真实图标效果
   - 性能可接受（图标类型通常不超过几百种）
   - 后续可平滑升级到 Phase 2B

2. **如果性能不足再优化到 Phase 2B**：
   - 当 drawcall 过多导致帧率下降时
   - 可平滑迁移，Phase 2A 的索引映射逻辑可复用

---

## 📂 相关文件说明

### 新增文件
| 路径 | 用途 | 行数 |
|------|------|------|
| `src/composables/useThreeIconTextureManager.ts` | Three.js 纹理管理器 | ~205 |

### 修改文件
| 路径 | 修改内容 | 影响范围 |
|------|---------|---------|
| `src/stores/settingsStore.ts` | 新增 threeDisplayMode 和 threeIconModeInOrthographic | 设置存储 |
| `src/components/SettingsDialog.vue` | 新增"3D 视图"分组 UI | 设置对话框 |
| `src/composables/useThreeInstancedRenderer.ts` | 新增 Icon InstancedMesh + updateIconFacing | 渲染系统 |
| `src/components/ThreeEditor.vue` | 集成模式切换和朝向同步 | 主编辑器 |

### 依赖关系
```
useSettingsStore
    ↓
SettingsDialog.vue (UI)
    ↓
ThreeEditor.vue (消费设置)
    ↓
useThreeInstancedRenderer (创建两套 mesh)
    ↓
useThreeIconTextureManager (管理纹理 - Phase 2 使用)
```

---

## 🎯 当前状态总结

**✅ 完成**:
- 设置框架（存储 + UI）
- Icon InstancedMesh 创建与矩阵/颜色同步
- 模式切换与显示条件
- 正交视图自动切换逻辑
- Icon 朝向同步（根据视图预设）
- 碰撞检测/Tooltip 对象切换

**⏳ 待做**:
- 真实图标纹理加载（Phase 2A）
- 性能优化（Phase 2B 图集方案 - 可选）
- 透视视图 Billboard 实时更新（可选增强）

**🐛 已知限制**:
- 当前所有图标都是占位符（灰色渐变 + "?"）
- 透视视图下不适合使用 Icon 模式（法线固定不变向相机）

---

## 💡 关键技术细节

### 坐标系映射
```
游戏坐标系 → Three.js 坐标系
X (长)     → X
Y (宽)     → Z  
Z (高)     → Y (垂直)

Icon 朝向向量解释：
- [0, 1, 0] = 向上（Top 视图，图标平行于 XZ 平面）
- [0, 0, 1] = 向前（Front 视图）
- [1, 0, 0] = 向右（Right 视图）
```

### 实例颜色机制
```
setColorAt(index, color)          // 设置第 index 个实例的颜色
mesh.instanceColor.needsUpdate = true  // 标记需要更新
```
图标会与该颜色混合，用于表示选中（蓝）、hover（橙）、分组（自定义）

### Icon 尺寸固定的优势
```
PlaneGeometry(180, 180) 游戏单位
↓
屏幕上显示大小固定（不随物品本身尺寸变化）
↓
提升小物品的可点击性（易于选中）
↓
复杂场景中鼠标悬停精度高
```

---

## 📝 下一步交接说明

### 给下一个 AI 的建议

1. **优先级排序**:
   - 🔴 **必做**: Phase 2A（按图标分组）- 让用户看到真实图标
   - 🟡 **如需优化**: Phase 2B（纹理图集）- 性能瓶颈时才做
   - 🟢 **锦上添花**: 透视视图 Billboard - 非必需

2. **从何开始**:
   - 从 `src/composables/useThreeInstancedRenderer.ts` 的 `rebuildInstances()` 函数开始
   - 理解当前的双 mesh 同步逻辑
   - 修改为按 gameId 分组的多 mesh 逻辑

3. **测试方案**:
   - 先在小数据集上测试（< 100 物品，< 10 种图标）
   - 使用浏览器控制台观察 `getThreeIconTextureManager().getCacheStats()`
   - 验证每种图标的纹理是否被正确加载

4. **常见坑**:
   - 别忘了 PlaneGeometry 需要 `vertexColors: true` 的材质
   - 更新索引映射时注意 Map 的同步（indexToIdMap + 新增的分组映射）
   - Icon 拖拽时只更新位置，不改变旋转和缩放

5. **参考资源**:
   - 2D 图标加载参考: `src/composables/useItemRenderer.ts` 和 `useIconLoader.ts`
   - Three.js InstancedMesh 文档: [官方示例](https://threejs.org/examples/?q=instanced)
   - Shader 参考（如需 Phase 2B）: `src/shaders/` 目录（如已存在）

---

## 📊 预计时间轴

| 阶段 | 任务 | 预计工时 | 优先级 |
|------|------|---------|--------|
| Phase 1 | 基础架构（✅ 已完成） | 4-5 天 | 必做 |
| Phase 2A | 按图标分组渲染 | 1-1.5 天 | 🔴 必做 |
| Phase 2B | 纹理图集优化 | 2-3 天 | 🟡 可选 |
| Phase 3 | 性能监测 + 缓存优化 | 1 天 | 🟢 优化 |

---

## 🔗 相关 Issue / TODO

- [ ] Phase 2A: 实现按图标分组的 InstancedMesh
- [ ] Phase 2A: 集成 useThreeIconTextureManager 的真实纹理加载
- [ ] Phase 2A: 更新索引映射逻辑支持多个 mesh
- [ ] 测试 + 性能基准测试
- [ ] Phase 2B（可选）: 实现纹理图集方案
- [ ] 文档补充：Shader 代码注释（如做 Phase 2B）

---

**文档审核**: 完整  
**最后修改**: 2025-11-17  
**下一步交接**: 等待实施 Phase 2A
