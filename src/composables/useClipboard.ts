import { computed } from 'vue'
import type { useEditorStore } from '../stores/editorStore'

export function useClipboard(editorStore: ReturnType<typeof useEditorStore>) {
  // 使用Store的全局剪贴板（支持跨方案复制粘贴）
  const hasClipboardData = computed(() => editorStore.clipboard.length > 0)

  // 复制选中项到剪贴板
  function copy() {
    if (editorStore.selectedItemIds.size === 0) {
      console.warn('[Clipboard] No items selected to copy')
      return
    }

    editorStore.copyToClipboard()
    console.log(`[Clipboard] Copied ${editorStore.clipboard.length} items`)
  }

  // 剪切选中项（复制 + 删除）
  function cut() {
    if (editorStore.selectedItemIds.size === 0) {
      console.warn('[Clipboard] No items selected to cut')
      return
    }

    editorStore.cutToClipboard()
    console.log(`[Clipboard] Cut ${editorStore.clipboard.length} items`)
  }

  // 粘贴剪贴板内容到画布
  function paste() {
    if (editorStore.clipboard.length === 0) {
      console.warn('[Clipboard] No items in clipboard to paste')
      return
    }

    // 使用Store的跨方案粘贴（不偏移位置）
    editorStore.pasteFromClipboard(0, 0)
    console.log(`[Clipboard] Pasted ${editorStore.clipboard.length} items`)
  }

  // 清空剪贴板
  function clearClipboard() {
    editorStore.clipboard.length = 0
    console.log('[Clipboard] Cleared')
  }

  return {
    clipboard: computed(() => editorStore.clipboard),
    hasClipboardData,
    copy,
    cut,
    paste,
    clearClipboard,
  }
}
