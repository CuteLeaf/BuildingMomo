本文档详细说明了一个基于 **Vue 3 + Vite + Konva.js** 技术栈的游戏建造辅助工具的设计与实现要点。请参考本文档的指导进行代码实施。

-----

## 1\. 🎯 项目概述 (Project Overview)

**项目名称：** 游戏建造坐标辅助器 (Game Build Helper)

**核心目标：**
开发一个Web应用，允许用户导入一个包含游戏内家具坐标的JSON文件。应用将在一个2D俯视画布上将这些家具显示为“圆点”。用户可以在这个画布上进行平移、缩放、批量框选、修改选区、批量移动、批量复制和批量删除操作。最后，用户可以导出一个包含修改后坐标的新JSON文件。

**核心用户流程：**

1.  用户打开网页。
2.  点击“导入JSON”，选择本地文件。
3.  画布上出现代表所有家具的“圆点”。
4.  用户通过“高度(Y轴)过滤器”筛选特定楼层的家具。
5.  用户在画布上拖拽框选一片区域的圆点。
6.  用户按住 `Shift` 并单击，以从选区中排除或添加个别圆点。
7.  用户对选中的圆点执行操作：
      * **移动：** 拖拽任意一个选中的圆点，所有选中的圆点一起移动。
      * **复制：** 按住 `Alt` 键并拖拽，在目标位置创建一套新的圆点。
      * **删除：** 按下 `Delete` 键，删除所有选中的圆点。
8.  用户点击“导出JSON”，保存修改后的数据。

## 2\. 🛠️ 技术栈 (Technology Stack)

  * **构建工具 (Build Tool):** Vite
  * **前端框架 (Framework):** Vue 3 (使用 `<script setup>` 语法和组合式 API)
  * **画布库 (Canvas Library):** Konva.js
  * **Vue-Konva 封装:** `vue-konva` (强烈推荐使用此库，它提供了Vue组件式的 Konva API，使集成更简单)

## 3\. 💾 数据结构 (Data Structures)

这是本应用的核心，仅供参考。

### 3.1. 输入 / 输出 JSON 格式

这是用户导入和导出的文件格式。

```typescript
// (in/out) game-item.dto.ts
interface GameItem {
  id: string; // 游戏内物品的ID，例如 "sofa_01"
  x: number;
  y: number; // 高度
  z: number;
}

// 文件内容为：Array<GameItem>
```

### 3.2. 内部状态数据格式

在应用内部，我们**不能**直接使用 `GameItem`。因为当用户复制物品时，我们需要一个**唯一的内部ID**来追踪Konva节点和Vue循环。

```typescript
// (internal) app-item.model.ts
interface AppItem {
  internalId: string; // 用于Vue/Konva的唯一key (使用 uuidv4 生成)
  gameId: string;     // 原始的游戏内ID (来自 GameItem.id)
  x: number;
  y: number;
  z: number;
}

// 主状态将是：ref<Array<AppItem>>
```

## 4\. 🏛️ 应用架构 (Application Architecture)

应用应采用组件化、单向数据流的结构。所有核心状态应提升到 `App.vue` 中管理。

  * **`App.vue` (状态中心)**
      * **职责：**
        1.  持有所有核心状态：
              * \`items = ref\<AppItem[]
                > ([])\`
              * `selectedItemIds = ref<Set<string>>(new Set())`
              * `heightFilter = ref<{ min: number, max: number }>({ min: -Infinity, max: Infinity })`
        2.  实现文件导入/导出逻辑。
        3.  渲染 `Toolbar.vue`, `Sidebar.vue`, 和 `CanvasEditor.vue`。
        4.  向子组件传递 Props 和监听 Events。
  * **`components/Toolbar.vue` (工具栏)**
      * **职责：**
        1.  包含“导入”、“导出”按钮。
        2.  包含“删除选中”按钮。
      * **Emits:** `@import`, `@export`, `@delete`。
  * **`components/Sidebar.vue` (侧边栏)**
      * **职责：**
        1.  提供两个 `input[type=range]` 或类似的滑块，用于设置 `heightFilter.min` 和 `heightFilter.max`。
        2.  显示当前选中的物品数量 (`selectedItemIds.size`)。
      * **Props:** `allItems: AppItem[]` (用于计算Y轴的min/max范围)。
      * **Emits:** `@update:heightFilter` (当滑块变化时)。
  * **`components/CanvasEditor.vue` (核心画布)**
      * **职责：**
        1.  渲染Konva舞台。
        2.  实现所有画布交互（平移、缩放、选择、操作）。
      * **Props:**
          * `items: AppItem[]`
          * `selectedItemIds: Set<string>`
          * `heightFilter: { min: number, max: number }`
      * **Emits:**
          * `@selection:update` (当选区发生变化时，返回新的 `Set<string>`)
          * `@items:update` (当物品被移动、复制、删除时，返回新的 `AppItem[]`)

-----

## 5\. ⚙️ 核心功能实现指南 (Core Implementation Guide)

### 5.1. 画布设置 (Canvas Setup) - `CanvasEditor.vue`

1.  **使用 `vue-konva`:**
    ```vue
    <v-stage ref="stageRef" :config="stageConfig" @wheel="handleZoom" @mousedown="handleStageMouseDown" ...>
      <v-layer ref="layerRef">
        <v-circle v-for="item in visibleItems" :key="item.internalId" :config="getCircleConfig(item)" @click="handleCircleClick" @dragstart="handleDragStart" @dragmove="handleDragMove" @dragend="handleDragEnd" />
        
        <v-rect :config="marqueeRectConfig" />
      </v-layer>
    </v-stage>
    ```
2.  **`stageConfig`:** 必须是 `draggable: true`。
3.  **坐标系映射 (关键！):**
      * 游戏坐标 `(x, z)` 映射到 Konva 画布坐标 `(x, y)`。
      * 游戏坐标 `y` (高度) **不**用于渲染位置，仅用于过滤。

### 5.2. 数据渲染与过滤 (Data Rendering & Filtering)

1.  **`visibleItems`:** 在 `CanvasEditor.vue` 中创建一个 `computed` 属性：
    ```javascript
    const visibleItems = computed(() => {
      return props.items.filter(item => {
        return item.y >= props.heightFilter.min && item.y <= props.heightFilter.max;
      });
    });
    ```
2.  **`getCircleConfig(item)`:** 这是一个返回Konva配置的函数。
    ```javascript
    const getCircleConfig = (item: AppItem) => ({
      id: item.internalId, // 必须设置，用于后续查找
      x: item.x,
      y: item.z, // 注意这里的坐标映射！
      radius: 5,
      fill: props.selectedItemIds.has(item.internalId) ? 'blue' : 'gray',
      stroke: 'black',
      strokeWidth: 1,
      draggable: true // 启用拖拽
    });
    ```

### 5.3. 画布交互：平移与缩放 (Pan & Zoom)

1.  **平移 (Pan):** `Konva` 的 `draggable: true` 已自动实现（通常是按住鼠标中键或 `Space`+左键，或在空白处拖拽）。
2.  **缩放 (Zoom):** 监听 `@wheel` 事件。
      * 必须调用 `event.evt.preventDefault()`。
      * 计算新的 `scale` 值（放大或缩小）。
      * 计算缩放后的新舞台位置 `(x, y)`，确保以**鼠标指针**为中心进行缩放。

### 5.4. 核心交互：选择 (Selection)

**A. 框选 (Marquee Selection)**

1.  **状态：**
      * `marqueeRectConfig = reactive({ x, y, width, height, visible: false, stroke: 'blue' })`
      * `isMarqueeing = ref(false)`
      * `marqueeStartPos = ref({ x: 0, y: 0 })`
2.  **`@mousedown` on Stage (画布):**
      * 如果 `event.target === event.currentTarget` (意味着点在空白处)，则开始框选。
      * `isMarqueeing.value = true`。
      * 记录起始点 `marqueeStartPos.value = stageRef.value.getPointerPosition()`。
      * `marqueeRectConfig.visible = true`。
3.  **`@mousemove` on Stage:**
      * 如果 `isMarqueeing.value === true`：
      * 更新 `marqueeRectConfig` 的 `x, y, width, height`，使其跟随鼠标。
4.  **`@mouseup` on Stage:**
      * 如果 `isMarqueeing.value === true`：
      * `isMarqueeing.value = false`。
      * `marqueeRectConfig.visible = false`。
      * 获取框选矩形的绝对包围盒 `marqueeBox`。
      * 遍历 `visibleItems`，找到所有Konva节点 (`layerRef.value.find('v-circle')`)，检查 `Konva.Util.haveIntersection(node.getClientRect(), marqueeBox)`。
      * 根据这些相交的节点ID，生成一个 `newSelectedIds: Set<string>`。
      * **处理 `Shift` 键：**
          * 如果 `event.evt.shiftKey` 按下：`newSet = new Set([...props.selectedItemIds, ...newSelectedIds])` (合并选区)。
          * 否则：`newSet = newSelectedIds` (替换选区)。
      * `emit('@selection:update', newSet)`。

**B. 点选 (Click Selection)**

1.  **`@click` on Circle:**
      * 获取被点击圆点的 `internalId = event.target.id()`。
      * `const newSet = new Set(props.selectedItemIds)`。
      * 如果 `event.evt.shiftKey` 按下：
          * `newSet.has(internalId) ? newSet.delete(internalId) : newSet.add(internalId)` (切换选中)。
      * 否则 (没有按 `Shift`)：
          * `newSet.clear()`。
          * `newSet.add(internalId)` (只选中这一个)。
      * `emit('@selection:update', newSet)`。

### 5.5. 核心交互：操作 (Operations)

**A. 移动 (Move)**

1.  **状态：** 需要一个临时变量来存储拖拽起始点，以计算**所有**选中单位的偏移。`dragStartPos = ref(null)`。
2.  **`@dragstart` on Circle:**
      * 记录被拖拽圆点的起始位置 `dragStartPos.value = { x: event.target.x(), y: event.target.y() }`。
3.  **`@dragmove` on Circle (关键性能点):**
      * 获取当前拖拽圆点的 `currentPos = { x: event.target.x(), y: event.target.y() }`。
      * 计算偏移量 `dx = currentPos.x - dragStartPos.value.x`, `dz = currentPos.y - dragStartPos.value.y`。
      * **不要**在这里 `emit`。为了性能，我们**只移动Konva节点**。
      * 遍历 `props.selectedItemIds`：
          * 找到对应的 Konva 节点 `node = stageRef.value.findOne('#' + id)`。
          * 如果 `node !== event.target` (不是被拖拽的那个)：
          * `node.absolutePosition({ x: originalItemPos.x + dx, y: originalItemPos.z + dz })` (需要一种方式提前缓存 `originalItemPos`，可以在 `dragstart` 时完成)。
4.  **`@dragend` on Circle:**
      * 计算最终的 `dx` 和 `dz`。
      * `dragStartPos.value = null`。
      * **提交更改：**
      * 创建一个**全新的 `items` 数组** (`newItems = props.items.map(...)`)。
      * 对于 `selectedItemIds` 中的每一个 `item`，其新坐标为 `x: item.x + dx`, `z: item.z + dz`。
      * `emit('@items:update', newItems)`。

**B. 复制 (Copy)**

1.  **逻辑：** 复制 = 检查 `Alt` 键的拖拽。
2.  在 `@dragend` 事件中检查 `event.evt.altKey`。
3.  如果 `altKey` 被按下：
      * **不要**执行移动的 `map`。
      * 改为创建一个 `newCopiedItems: AppItem[]` 数组。
      * 遍历 `props.selectedItemIds`，为每一项：
          * 生成 `newInternalId = uuidv4()`。
          * `newItem = { internalId: newInternalId, gameId: item.gameId, x: item.x + dx, y: item.y, z: item.z + dz }`。
      * 创建一个新的 `items` 数组：`newItems = [...props.items, ...newCopiedItems]`。
      * `emit('@items:update', newItems)`。
      * (可选，但推荐) 立即 `emit('@selection:update', new Set(newCopiedItems.map(i => i.internalId)))`，使新复制的物品成为当前选区。

**C. 删除 (Delete)**

1.  **`Toolbar.vue`** 发出 `@delete` 事件。
2.  **`App.vue`** 监听此事件。
3.  `const newItems = items.value.filter(item => !selectedItemIds.value.has(item.internalId))`。
4.  `items.value = newItems`。
5.  `selectedItemIds.value.clear()`。

### 5.6. 文件 I/O (File I/O) - `App.vue`

1.  **导入 (`@import`):**
      * 使用 `<input type="file" @change="handleFileLoad">`。
      * 使用 `FileReader` API 读取文件内容 (readAsText)。
      * `const data = JSON.parse(fileContent) as GameItem[]`。
      * 将 `GameItem[]` 转换为 `AppItem[]` (即 `map` 并添加 `internalId: uuidv4()`)。
      * `items.value = newAppItems`。
2.  **导出 (`@export`):**
      * 将 `items.value` (即 `AppItem[]`) 转换回 `GameItem[]` (即 `map` 并移除 `internalId`，将 `gameId` 换回 `id`)。
      * `const jsonString = JSON.stringify(gameItems, null, 2)`。
      * 使用 `Blob` 和 `URL.createObjectURL` 创建一个下载链接，并程序化点击它。