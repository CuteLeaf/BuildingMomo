import { onMounted, onUnmounted, ref, computed, type Ref } from 'vue'
import type { Command } from '../stores/commandStore'

export interface UseKeyboardShortcutsOptions {
  commands: Command[]
  executeCommand: (commandId: string) => void
  stageRef: Ref<any>
  stageConfig: Ref<any>
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { commands, executeCommand, stageRef, stageConfig } = options

  // 空格键状态（用于画布拖拽）
  const isSpacePressed = ref(false)

  // 构建快捷键映射表（响应式）
  const shortcutMap = computed(() => {
    const map = new Map<string, string>()
    commands.forEach((cmd) => {
      if (cmd.shortcut) {
        map.set(normalizeShortcut(cmd.shortcut), cmd.id)
      }
    })
    return map
  })

  // 标准化快捷键字符串（统一格式）
  function normalizeShortcut(shortcut: string): string {
    return shortcut.toLowerCase().replace(/\s/g, '').replace('ctrl', 'control')
  }

  // 将键盘事件转换为快捷键字符串
  function eventToShortcut(event: KeyboardEvent): string {
    const parts: string[] = []

    if (event.ctrlKey || event.metaKey) parts.push('control')
    if (event.shiftKey) parts.push('shift')
    if (event.altKey) parts.push('alt')

    // 处理特殊键
    let key = event.key.toLowerCase()

    // 标准化一些特殊键名
    if (key === '+') key = '='
    if (key === '_') key = '-'

    // 不重复添加修饰键
    if (!['control', 'shift', 'alt', 'meta'].includes(key)) {
      parts.push(key)
    }

    return parts.join('+')
  }

  // 键盘按下事件
  function handleKeyDown(event: KeyboardEvent) {
    // 如果在输入框中，不处理快捷键
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    // 处理空格键（画布拖拽模式）
    if (event.code === 'Space' && !isSpacePressed.value) {
      event.preventDefault()
      isSpacePressed.value = true
      stageConfig.value.draggable = true

      // 更新鼠标光标样式
      const stage = stageRef.value?.getStage()
      if (stage) {
        const container = stage.container()
        container.style.cursor = 'grab'
      }
      return
    }

    // 匹配快捷键命令
    const shortcut = eventToShortcut(event)
    const commandId = shortcutMap.value.get(shortcut)

    if (commandId) {
      event.preventDefault()
      console.log(`[Shortcut] Triggered: ${shortcut} -> ${commandId}`)
      executeCommand(commandId)
    }
  }

  // 键盘释放事件
  function handleKeyUp(event: KeyboardEvent) {
    // 处理空格键释放（恢复框选模式）
    if (event.code === 'Space') {
      event.preventDefault()
      isSpacePressed.value = false
      stageConfig.value.draggable = false

      // 恢复默认光标
      const stage = stageRef.value?.getStage()
      if (stage) {
        const container = stage.container()
        container.style.cursor = 'default'
      }
    }
  }

  // 生命周期钩子
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    console.log(`[Shortcuts] Registered ${shortcutMap.value.size} keyboard shortcuts`)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    console.log('[Shortcuts] Unregistered keyboard shortcuts')
  })

  return {
    isSpacePressed,
    shortcutMap,
  }
}
