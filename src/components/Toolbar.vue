<script setup lang="ts">
import { ref } from 'vue'
import { useEditorStore } from '../stores/editorStore'

const editorStore = useEditorStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

// 触发文件选择
function triggerFileInput() {
  fileInputRef.value?.click()
}

// 处理文件导入
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const result = editorStore.importJSON(content)
    
    if (result.success) {
      console.log(`Successfully imported ${result.itemCount} items`)
    } else {
      alert(`Import failed: ${result.error}`)
    }
  }
  reader.readAsText(file)
  
  // 重置input以允许重新选择相同文件
  target.value = ''
}
</script>

<template>
  <div class="h-14 border-b border-gray-200 bg-white px-4 flex items-center gap-3">
    <!-- 隐藏的文件input -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      class="hidden"
      @change="handleFileChange"
    />
    
    <!-- 导入按钮 -->
    <button
      @click="triggerFileInput"
      class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
    >
      导入 JSON
    </button>
    
    <!-- 标题 -->
    <div class="flex-1 flex items-center justify-center">
      <h1 class="text-lg font-semibold text-gray-700">建造坐标辅助器</h1>
    </div>
    
    <!-- 占位，保持标题居中 -->
    <div class="w-24"></div>
  </div>
</template>
