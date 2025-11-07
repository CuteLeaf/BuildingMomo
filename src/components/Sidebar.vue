<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '../stores/editorStore'

const editorStore = useEditorStore()

// 计算属性：格式化Z轴范围显示
const formattedZRange = computed(() => {
  const { min, max } = editorStore.heightFilter
  return {
    min: min.toFixed(2),
    max: max.toFixed(2)
  }
})

// 更新高度过滤器
function updateMinFilter(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  editorStore.updateHeightFilter(value, editorStore.heightFilter.currentMax)
}

function updateMaxFilter(event: Event) {
  const value = parseFloat((event.target as HTMLInputElement).value)
  editorStore.updateHeightFilter(editorStore.heightFilter.currentMin, value)
}
</script>

<template>
  <div class="w-64 border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-6">
    <!-- 统计信息 -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">统计信息</h2>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600">总物品数：</span>
          <span class="font-medium">{{ editorStore.stats.totalItems }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-gray-600">可见物品：</span>
          <span class="font-medium text-blue-600">{{ editorStore.stats.visibleItems }}</span>
        </div>
      </div>
    </div>

    <!-- 高度过滤器 -->
    <div class="bg-white rounded-lg p-4 shadow-sm">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">高度过滤 (Z轴)</h2>
      
      <!-- Z轴范围显示 -->
      <div class="text-xs text-gray-500 mb-4">
        范围: {{ formattedZRange.min }} ~ {{ formattedZRange.max }}
      </div>

      <!-- 最小值滑块 -->
      <div class="mb-4">
        <label class="text-xs text-gray-600 block mb-1">
          最小值: {{ editorStore.heightFilter.currentMin.toFixed(2) }}
        </label>
        <input
          type="range"
          :min="editorStore.heightFilter.min"
          :max="editorStore.heightFilter.max"
          :value="editorStore.heightFilter.currentMin"
          :step="(editorStore.heightFilter.max - editorStore.heightFilter.min) / 100"
          @input="updateMinFilter"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>

      <!-- 最大值滑块 -->
      <div>
        <label class="text-xs text-gray-600 block mb-1">
          最大值: {{ editorStore.heightFilter.currentMax.toFixed(2) }}
        </label>
        <input
          type="range"
          :min="editorStore.heightFilter.min"
          :max="editorStore.heightFilter.max"
          :value="editorStore.heightFilter.currentMax"
          :step="(editorStore.heightFilter.max - editorStore.heightFilter.min) / 100"
          @input="updateMaxFilter"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
      </div>
    </div>

    <!-- 提示信息 -->
    <div v-if="editorStore.items.length === 0" class="text-xs text-gray-500 text-center mt-4">
      请导入 JSON 文件开始编辑
    </div>
  </div>
</template>
