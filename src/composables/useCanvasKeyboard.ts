import { ref, type Ref, onMounted, onUnmounted } from 'vue'
import type { useEditorStore } from '../stores/editorStore'

export function useCanvasKeyboard(
  editorStore: ReturnType<typeof useEditorStore>,
  stageRef: Ref<any>,
  stageConfig: Ref<any>
) {
  // 空格键状态（用于画布拖拽）
  const isSpacePressed = ref(false)

  // 键盘事件
  function handleKeyDown(e: KeyboardEvent) {
    // Delete/Backspace 删除
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      editorStore.deleteSelected()
      return
    }

    // 空格键按下 - 启用画布拖拽模式
    if (e.code === 'Space' && !isSpacePressed.value) {
      e.preventDefault()
      isSpacePressed.value = true
      stageConfig.value.draggable = true

      // 更新鼠标光标样式
      const stage = stageRef.value?.getStage()
      if (stage) {
        const container = stage.container()
        container.style.cursor = 'grab'
      }
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    // 空格键释放 - 恢复框选模式
    if (e.code === 'Space') {
      e.preventDefault()
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
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })

  return {
    isSpacePressed,
  }
}
