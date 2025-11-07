# 项目进度文档

## 📌 项目概述

**项目名称：** 游戏建造坐标辅助器 (Game Build Helper)

**技术栈：** Vue 3 + Vite + Konva.js + Pinia + Tailwind CSS 4 + shadcn-vue

**核心功能：** 允许用户导入游戏家具坐标JSON文件，在2D画布上显示为圆点，支持高度过滤、缩放平移、批量选择/移动/复制/删除，最后导出修改后的JSON。

---

## ✅ 已完成功能（Phase 1: 基础显示）

### 1. 项目结构搭建

已创建的文件结构：
```
src/
├── types/
│   └── editor.ts              # TypeScript 接口定义
├── stores/
│   └── editorStore.ts         # Pinia 状态管理
├── components/
│   ├── Toolbar.vue            # 顶部工具栏
│   ├── Sidebar.vue            # 左侧边栏
│   └── CanvasEditor.vue       # Konva 画布
├── App.vue                    # 主应用（已更新）
└── main.ts                    # 入口文件（已注册 Pinia 和 VueKonva）
```

### 2. 数据结构定义 (`src/types/editor.ts`)

**核心接口：**
- `GameItem`: 原始JSON数据格式（对应 `PlaceInfo` 数组中的每一项）
- `AppItem`: 内部使用的数据格式（增加 `internalId`）
- `HeightFilter`: 高度过滤器配置
- `GameDataFile`: JSON文件根结构 `{NeedRestore, PlaceInfo}`

**重要坐标映射：**
```
JSON数据           内部数据        Konva渲染
Location.X    →    x           →   x 轴（平面）
Location.Y    →    y           →   y 轴（平面）
Location.Z    →    z           →   用于高度过滤，不参与2D渲染
```

### 3. 状态管理 (`src/stores/editorStore.ts`)

**状态：**
- `items: AppItem[]` - 所有物品数据
- `heightFilter: HeightFilter` - 高度过滤器（min/max/currentMin/currentMax）
- `visibleItems` (computed) - 经过高度过滤后的可见物品
- `stats` (computed) - 统计信息（总数/可见数/Z轴范围）

**核心方法：**
- `importJSON(fileContent: string)` - 导入JSON文件
  - 解析JSON数据
  - 转换为 AppItem 格式（添加 internalId）
  - 自动计算Z轴范围
- `updateHeightFilter(newMin, newMax)` - 更新高度过滤器
- `clearData()` - 清空数据

### 4. UI 组件

#### Toolbar.vue（顶部工具栏）
- ✅ 导入JSON按钮（使用 FileReader API）
- ✅ 标题显示
- ✅ 导入成功/失败提示

#### Sidebar.vue（左侧边栏，宽度256px）
- ✅ 统计信息卡片
  - 总物品数
  - 可见物品数
- ✅ 高度过滤器（Z轴）
  - 显示Z轴范围
  - 最小值滑块
  - 最大值滑块
- ✅ 空状态提示

#### CanvasEditor.vue（Konva画布）
- ✅ Stage 配置（可拖拽）
- ✅ 渲染圆点
  - 坐标：游戏X→Konva.x，游戏Y→Konva.y
  - 样式：半径6px，灰色填充（#94a3b8），深灰边框（#475569）
- ✅ 鼠标滚轮缩放（以鼠标为中心）
- ✅ 拖拽平移（Stage draggable）
- ✅ 原点标记（红色圆点 + 文字）
- ✅ 缩放比例显示（右下角）
- ✅ 空状态提示（未导入文件时）
- ✅ 响应式窗口大小

### 5. 功能测试

**测试方法：**
1. 启动开发服务器：`npm run dev`（当前运行在 http://localhost:5174/）
2. 点击"导入 JSON"按钮
3. 选择根目录的 `default.json` 文件
4. 应该能看到：
   - 侧边栏显示物品数量和Z轴范围
   - 画布上显示所有圆点
   - 可以使用滑块过滤不同高度的物品
   - 可以缩放/平移画布

---

## 🚧 待完成功能

### Phase 2: 交互功能（优先级：高）

#### 2.1 选择功能
- [ ] **框选（Marquee Selection）**
  - 在空白处按下鼠标 → 显示选择框
  - 拖拽鼠标 → 更新选择框大小
  - 释放鼠标 → 检测矩形内的圆点
  - Shift + 框选 → 追加到已选区域
  - 需要状态：`selectedItemIds: Set<string>` (在 store 中添加)
  
- [ ] **点选（Click Selection）**
  - 单击圆点 → 选中该圆点（清空其他选中）
  - Shift + 单击 → 切换该圆点的选中状态

- [ ] **选中视觉反馈**
  - 选中的圆点：蓝色填充（#3b82f6）
  - 未选中：灰色填充（#94a3b8）

#### 2.2 编辑操作
- [ ] **批量移动**
  - 拖拽任一选中圆点 → 所有选中圆点同步移动
  - dragstart → 记录起始位置
  - dragmove → 计算偏移量，移动所有选中节点
  - dragend → 更新 store 中的数据

- [ ] **Alt 复制**
  - Alt + 拖拽选中圆点 → 在目标位置创建副本
  - 生成新的 internalId
  - 保留原始 gameId 和其他属性
  - 复制后自动选中新副本

- [ ] **Delete 删除**
  - 按下 Delete 键 → 删除所有选中圆点
  - 从 items 数组中移除
  - 清空 selectedItemIds

#### 2.3 Store 扩展
需要在 `editorStore.ts` 中添加：
```typescript
const selectedItemIds = ref<Set<string>>(new Set())

function updateSelection(newSelectedIds: Set<string>) { ... }
function updateItems(newItems: AppItem[]) { ... }
function deleteSelected() { ... }
function duplicateItems(itemIds: string[], dx: number, dy: number) { ... }
```

### Phase 3: 导出功能（优先级：中）

- [ ] **导出按钮**（Toolbar.vue）
  - 添加"导出 JSON"按钮
  
- [ ] **数据转换**
  - AppItem[] → GameItem[]
  - 保留所有原始字段（Rotation, Scale, ColorMap 等）
  - 更新 Location.X, Location.Y, Location.Z
  
- [ ] **文件下载**
  - 使用 Blob + URL.createObjectURL
  - 默认文件名：`edited_${timestamp}.json`

### Phase 4: 优化与增强（优先级：低）

- [ ] 撤销/重做功能
- [ ] 键盘快捷键（Ctrl+C 复制，Ctrl+V 粘贴）
- [ ] 网格背景
- [ ] 圆点颜色分类（根据 ItemID 或 GroupID）
- [ ] 性能优化（虚拟化渲染，如果物品数量>1000）

---

## 🔑 关键实现细节

### 1. 坐标系统
```
游戏坐标系统          Konva 2D 画布
X (平面左右) ------→  x 轴
Y (平面前后) ------→  y 轴
Z (高度上下) ------→  不渲染，仅用于过滤
```

### 2. 数据流
```
用户导入JSON
    ↓
GameDataFile.PlaceInfo[]
    ↓
转换为 AppItem[] (添加 internalId)
    ↓
存储到 editorStore.items
    ↓
经过 heightFilter 过滤
    ↓
editorStore.visibleItems (computed)
    ↓
CanvasEditor 渲染为 v-circle
```

### 3. 选择交互流程（待实现）
```
用户操作
    ↓
CanvasEditor 事件处理
    ↓
emit @selection:update 或 @items:update
    ↓
更新 editorStore 状态
    ↓
视图自动响应（Vue 响应式）
```

---

## 📚 重要参考

### 开发文档
- `dev.md` - 详细的设计指南（仅供参考，部分内容已调整）
- 关键差异：开发文档建议状态提升到 App.vue，但实际采用 Pinia Store

### 测试数据
- `default.json` - 示例JSON文件
- 结构：`{NeedRestore: boolean, PlaceInfo: GameItem[]}`
- PlaceInfo 包含物品的完整信息（坐标、旋转、缩放、颜色等）

### 技术栈文档
- Vue 3: https://vuejs.org/
- Konva.js: https://konvajs.org/
- vue-konva: https://github.com/konvajs/vue-konva
- Pinia: https://pinia.vuejs.org/

---

## 🎯 下一步行动建议

### 立即任务（建议优先级）
1. **测试当前功能**
   - 导入 default.json
   - 测试高度过滤器
   - 测试缩放/平移

2. **实现选择功能**
   - 在 Store 中添加 `selectedItemIds` 状态
   - 实现框选逻辑（最复杂，建议先实现）
   - 实现点选逻辑
   - 更新圆点颜色（选中/未选中）

3. **实现移动功能**
   - 批量移动逻辑（拖拽同步）
   - 更新数据到 Store

4. **实现复制和删除**
   - Alt + 拖拽复制
   - Delete 键删除

5. **实现导出功能**
   - 添加导出按钮
   - 数据转换逻辑
   - 文件下载

---

## ⚠️ 注意事项

1. **圆点可拖拽配置**：CanvasEditor 中圆点的 `draggable: true` 目前被注释掉了，实现移动功能时需要启用。

2. **坐标映射**：务必记住 `游戏Y → Konva y`，`游戏Z → 过滤器`。

3. **性能考虑**：default.json 可能包含大量数据，如果圆点数量>1000，考虑：
   - 只渲染可见区域的圆点（视口裁剪）
   - 使用 Konva.Group 优化批量操作

4. **响应式问题**：CanvasEditor 监听了 window resize 事件，记得在组件销毁时移除监听器（添加 onUnmounted）。

5. **TypeScript 严格模式**：所有新增的方法都需要明确的类型定义。

---

## 🚀 启动项目

```bash
# 安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev

# 访问应用
http://localhost:5174/
```

---

**文档创建时间：** 2025-11-07  
**当前阶段：** Phase 1 完成，Phase 2 待实现  
**预计完整项目完成时间：** Phase 2-3 约需 2-3 小时开发
