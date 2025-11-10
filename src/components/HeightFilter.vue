<script setup lang="ts">
import { computed, ref } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { cn } from '@/lib/utils'

interface Props {
  min: number
  max: number
  currentMin: number
  currentMax: number
  step?: number
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  step: undefined,
  label: '高度过滤 (Z轴)',
})

const emit = defineEmits<{
  update: [value: { min: number; max: number }]
}>()

// 计算步长：如果未提供，则使用范围的 1%
const computedStep = computed(() => {
  return props.step ?? (props.max - props.min) / 100
})

// 双向绑定的范围数组
const modelValue = computed({
  get: () => [props.currentMin, props.currentMax],
  set: (value: number[]) => {
    if (value.length === 2) {
      emit('update', { min: value[0]!, max: value[1]! })
    }
  },
})

// 跟踪每个手柄的 hover 状态
const hoverStates = ref<boolean[]>([false, false])

function setHoverState(index: number, value: boolean) {
  hoverStates.value[index] = value
}
</script>

<template>
  <div class="rounded-lg bg-white p-4 shadow-sm">
    <h2 class="mb-4 text-sm font-semibold text-gray-700">
      {{ label }}
    </h2>

    <SliderRoot
      v-model="modelValue"
      :min="min"
      :max="max"
      :step="computedStep"
      :min-steps-between-thumbs="0"
      :class="
        cn('relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50')
      "
    >
      <SliderTrack
        class="relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full"
      >
        <SliderRange class="absolute bg-primary data-[orientation=horizontal]:h-full" />
      </SliderTrack>

      <!-- Min 手柄 with 自定义浮动提示 -->
      <SliderThumb
        class="relative block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        @mouseenter="setHoverState(0, true)"
        @mouseleave="setHoverState(0, false)"
      >
        <!-- 浮动提示 -->
        <div
          v-show="hoverStates[0]"
          class="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 animate-in rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white fade-in-0 zoom-in-95"
        >
          {{ currentMin.toFixed(2) }}
        </div>
      </SliderThumb>

      <!-- Max 手柄 with 自定义浮动提示 -->
      <SliderThumb
        class="relative block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        @mouseenter="setHoverState(1, true)"
        @mouseleave="setHoverState(1, false)"
      >
        <!-- 浮动提示 -->
        <div
          v-show="hoverStates[1]"
          class="pointer-events-none absolute -top-8 left-1/2 z-50 -translate-x-1/2 animate-in rounded bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white fade-in-0 zoom-in-95"
        >
          {{ currentMax.toFixed(2) }}
        </div>
      </SliderThumb>
    </SliderRoot>
  </div>
</template>
