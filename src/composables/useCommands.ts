import { computed, type ComputedRef } from 'vue'
import type { useEditorStore } from '../stores/editorStore'

// 命令接口
export interface Command {
  id: string
  label: string
  shortcut?: string
  category: 'file' | 'edit' | 'view'
  enabled: () => boolean
  execute: () => void | Promise<void>
}

// 命令分类
export type CommandCategory = 'file' | 'edit' | 'view'

export interface UseCommandsOptions {
  editorStore: ReturnType<typeof useEditorStore>
  clipboard: {
    copy: () => void
    cut: () => void
    paste: () => void
    hasClipboardData: ComputedRef<boolean>
  }
  fileOps: {
    importJSON: () => Promise<void>
    exportJSON: () => void
  }
  zoom: {
    zoomIn: () => void
    zoomOut: () => void
    resetView: () => void
  }
}

export function useCommands(options: UseCommandsOptions) {
  const { editorStore, clipboard, fileOps, zoom } = options

  // 定义所有命令
  const commands: Command[] = [
    // ===== 文件菜单 =====
    {
      id: 'file.import',
      label: '导入 JSON',
      shortcut: 'Ctrl+O',
      category: 'file',
      enabled: () => true,
      execute: async () => {
        console.log('[Command] 导入 JSON')
        await fileOps.importJSON()
      },
    },
    {
      id: 'file.export',
      label: '导出 JSON',
      shortcut: 'Ctrl+S',
      category: 'file',
      enabled: () => editorStore.items.length > 0,
      execute: () => {
        console.log('[Command] 导出 JSON')
        fileOps.exportJSON()
      },
    },

    // ===== 编辑菜单 =====
    {
      id: 'edit.cut',
      label: '剪切',
      shortcut: 'Ctrl+X',
      category: 'edit',
      enabled: () => editorStore.selectedItemIds.size > 0,
      execute: () => {
        console.log('[Command] 剪切')
        clipboard.cut()
      },
    },
    {
      id: 'edit.copy',
      label: '复制',
      shortcut: 'Ctrl+C',
      category: 'edit',
      enabled: () => editorStore.selectedItemIds.size > 0,
      execute: () => {
        console.log('[Command] 复制')
        clipboard.copy()
      },
    },
    {
      id: 'edit.paste',
      label: '粘贴',
      shortcut: 'Ctrl+V',
      category: 'edit',
      enabled: () => clipboard.hasClipboardData.value,
      execute: () => {
        console.log('[Command] 粘贴')
        clipboard.paste()
      },
    },
    {
      id: 'edit.delete',
      label: '删除',
      shortcut: 'Delete',
      category: 'edit',
      enabled: () => editorStore.selectedItemIds.size > 0,
      execute: () => {
        console.log('[Command] 删除')
        editorStore.deleteSelected()
      },
    },
    {
      id: 'edit.selectAll',
      label: '全选',
      shortcut: 'Ctrl+A',
      category: 'edit',
      enabled: () => editorStore.visibleItems.length > 0,
      execute: () => {
        console.log('[Command] 全选')
        editorStore.selectAll()
      },
    },
    {
      id: 'edit.deselectAll',
      label: '取消选择',
      shortcut: 'Escape',
      category: 'edit',
      enabled: () => editorStore.selectedItemIds.size > 0,
      execute: () => {
        console.log('[Command] 取消选择')
        editorStore.clearSelection()
      },
    },
    {
      id: 'edit.invertSelection',
      label: '反选',
      shortcut: 'Ctrl+Shift+A',
      category: 'edit',
      enabled: () => editorStore.visibleItems.length > 0,
      execute: () => {
        console.log('[Command] 反选')
        editorStore.invertSelection()
      },
    },

    // ===== 视图菜单 =====
    {
      id: 'view.zoomIn',
      label: '放大',
      shortcut: 'Ctrl+=',
      category: 'view',
      enabled: () => editorStore.items.length > 0,
      execute: () => {
        console.log('[Command] 放大')
        zoom.zoomIn()
      },
    },
    {
      id: 'view.zoomOut',
      label: '缩小',
      shortcut: 'Ctrl+-',
      category: 'view',
      enabled: () => editorStore.items.length > 0,
      execute: () => {
        console.log('[Command] 缩小')
        zoom.zoomOut()
      },
    },
    {
      id: 'view.resetView',
      label: '重置视图',
      category: 'view',
      enabled: () => editorStore.items.length > 0,
      execute: () => {
        console.log('[Command] 重置视图')
        zoom.resetView()
      },
    },
  ]

  // 命令映射表（方便快速查找）
  const commandMap = new Map<string, Command>()
  commands.forEach((cmd) => commandMap.set(cmd.id, cmd))

  // 按分类获取命令
  function getCommandsByCategory(category: CommandCategory): Command[] {
    return commands.filter((cmd) => cmd.category === category)
  }

  // 执行命令
  function executeCommand(commandId: string) {
    const command = commandMap.get(commandId)
    if (!command) {
      console.warn(`Command not found: ${commandId}`)
      return
    }

    if (!command.enabled()) {
      console.warn(`Command disabled: ${commandId}`)
      return
    }

    command.execute()
  }

  // 检查命令是否可用
  function isCommandEnabled(commandId: string): boolean {
    const command = commandMap.get(commandId)
    return command ? command.enabled() : false
  }

  return {
    commands: computed(() => commands),
    commandMap,
    getCommandsByCategory,
    executeCommand,
    isCommandEnabled,
  }
}
