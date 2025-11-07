# Menubar 命令系统实现文档

## 📅 实施时间
2025-11-07

## 🎯 实施目标
实现类似 PS/VSCode 的顶部菜单栏系统，统一管理命令和快捷键。

## ✅ 已完成的功能

### 1. 命令系统架构

创建了统一的命令中心模式，所有功能通过命令系统触发，支持菜单点击和快捷键两种方式。

#### 核心 Composables

**`useCommands.ts`** - 命令注册中心
- 定义所有命令的接口和元数据
- 命令分类：文件（file）、编辑（edit）、视图（view）
- 动态判断命令可用性（enabled 函数）
- 统一的命令执行接口

**`useKeyboardShortcuts.ts`** - 快捷键管理器
- 监听全局键盘事件
- 解析组合键（Ctrl+C, Ctrl+Shift+A 等）
- 自动关联命令系统
- 处理空格键画布拖拽模式
- 防止浏览器默认行为冲突

**`useClipboard.ts`** - 剪贴板管理
- 内部剪贴板（存储 AppItem 对象）
- 复制、剪切、粘贴功能
- 粘贴策略：相对原位置偏移 +50, +50

**`useFileOperations.ts`** - 文件导入导出
- 导入 JSON 文件（通过文件选择器）
- 导出完整 JSON 文件
- 数据格式转换（AppItem ↔ GameItem）

### 2. 菜单栏功能

使用 shadcn-vue 的 Menubar 组件，实现了三个主菜单：

#### 📁 文件菜单
- **导入 JSON** (Ctrl+O) - 触发文件选择器导入数据
- **导出 JSON** (Ctrl+S) - 导出修改后的完整数据

#### ✏️ 编辑菜单
- **剪切** (Ctrl+X) - 剪切选中项到剪贴板
- **复制** (Ctrl+C) - 复制选中项到剪贴板
- **粘贴** (Ctrl+V) - 粘贴剪贴板内容（偏移 +50, +50）
- **删除** (Delete) - 删除选中项
- ────────────
- **全选** (Ctrl+A) - 选中所有可见物品
- **取消选择** (Escape) - 清空选择
- **反选** (Ctrl+Shift+A) - 反转当前选择

#### 🔍 视图菜单
- **放大** (Ctrl+=) - 以画布中心放大
- **缩小** (Ctrl+-) - 以画布中心缩小
- ────────────
- **重置视图** - 恢复到初始视图状态

### 3. 扩展的 Store 方法

在 `editorStore.ts` 中新增：
- `selectAll()` - 全选可见物品
- `invertSelection()` - 反选
- `pasteItems(items, offsetX, offsetY)` - 粘贴物品

### 4. 增强的缩放功能

在 `useCanvasZoom.ts` 中新增：
- `zoomIn()` - 以画布中心放大（1.2 倍）
- `zoomOut()` - 以画布中心缩小（1.2 倍）

### 5. 重构的组件

**`Toolbar.vue`**
- 从简单的导入按钮改为完整的 Menubar
- 使用 inject 注入命令系统
- 动态渲染菜单项
- 显示快捷键提示
- 根据状态禁用/启用菜单项

**`CanvasEditor.vue`**
- 集成所有新的 composables
- 提供命令系统给 Toolbar
- 移除旧的 useCanvasKeyboard（已整合到新系统）

### 6. 删除的旧文件

- `useCanvasKeyboard.ts` - 已完全整合到 `useKeyboardShortcuts.ts`

## 🔑 关键设计决策

### 1. 命令中心模式
- ✅ 菜单和快捷键共享同一套逻辑
- ✅ 便于后续实现撤销/重做
- ✅ 易于扩展新功能
- ✅ 统一的状态管理

### 2. 粘贴策略
选择了**相对原位置偏移 +50, +50**：
- 避免新粘贴的物品与原物品完全重叠
- 类似 Photoshop 的行为
- 便于用户发现新粘贴的内容

### 3. 快捷键处理
- 统一的快捷键解析器
- 防止浏览器默认行为（Ctrl+S, Ctrl+A 等）
- 在输入框中不触发快捷键
- 保留空格键画布拖拽功能

### 4. 命令可用性
动态判断每个命令是否可用：
- 没有选中项时，复制/剪切/删除变灰
- 没有剪贴板数据时，粘贴变灰
- 没有物品时，视图操作变灰

## 📦 文件结构

```
src/
├── composables/
│   ├── useCommands.ts           # 新增 - 命令注册中心
│   ├── useKeyboardShortcuts.ts  # 新增 - 快捷键管理器
│   ├── useClipboard.ts          # 新增 - 剪贴板管理
│   ├── useFileOperations.ts     # 新增 - 文件操作
│   ├── useCanvasZoom.ts         # 修改 - 添加 zoomIn/zoomOut
│   ├── useCanvasSelection.ts    # 保持不变
│   ├── useCanvasDrag.ts         # 保持不变
│   └── useCanvasRendering.ts    # 保持不变
├── stores/
│   └── editorStore.ts           # 修改 - 添加新方法
├── components/
│   ├── Toolbar.vue              # 重构 - 使用 Menubar
│   └── CanvasEditor.vue         # 修改 - 集成命令系统
└── types/
    └── editor.ts                # 保持不变
```

## 🚀 使用方式

### 菜单操作
1. 点击顶部"文件"/"编辑"/"视图"菜单
2. 选择对应的命令
3. 灰色的菜单项表示当前不可用

### 快捷键
所有快捷键在菜单中都有显示，主要包括：
- `Ctrl+O` - 导入
- `Ctrl+S` - 导出
- `Ctrl+C/X/V` - 复制/剪切/粘贴
- `Ctrl+A` - 全选
- `Ctrl+Shift+A` - 反选
- `Escape` - 取消选择
- `Delete` - 删除
- `Ctrl+=/Ctrl+-` - 放大/缩小
- `Space` - 画布拖拽模式（按住）

### 命令日志
所有命令执行时都会在控制台打印日志，格式：
```
[Command] 命令名称
[Shortcut] Triggered: ctrl+c -> edit.copy
[Clipboard] Copied 3 items
```

## 📝 测试建议

1. **菜单测试**
   - 导入 default.json
   - 测试所有菜单项的点击
   - 验证禁用状态是否正确

2. **快捷键测试**
   - 选中物品后按 Ctrl+C 复制
   - 按 Ctrl+V 粘贴（应偏移 50 单位）
   - 按 Ctrl+X 剪切
   - 按 Ctrl+A 全选
   - 按 Escape 取消选择

3. **导出测试**
   - 修改物品位置
   - 按 Ctrl+S 导出
   - 验证导出的 JSON 文件格式正确

4. **视图测试**
   - 按 Ctrl+= 放大
   - 按 Ctrl+- 缩小
   - 点击"重置视图"

## ⚠️ 已知限制

1. **撤销/重做功能未实现** - 这是下一阶段的任务
2. **剪贴板不支持系统级** - 只能在应用内部使用
3. **粘贴位置固定偏移** - 未实现粘贴到鼠标位置
4. **无最近文件列表** - 导入功能未记录历史

## 🔮 未来扩展

### 高优先级
- [ ] 撤销/重做系统（需要状态快照或命令模式）
- [ ] 多次粘贴时自动递增偏移量

### 中优先级
- [ ] 最近打开文件列表
- [ ] 导出选中项功能
- [ ] 命令面板（Ctrl+Shift+P）

### 低优先级
- [ ] 自定义快捷键
- [ ] 命令执行历史
- [ ] 键盘快捷键帮助对话框

## 📚 相关文档

- 设计讨论：见聊天记录
- 原始进度文档：`PROGRESS.md`
- 开发指南：`dev.md`

---

**实施完成时间：** 2025-11-07  
**所有 TODO 已完成，系统已可正常使用**

