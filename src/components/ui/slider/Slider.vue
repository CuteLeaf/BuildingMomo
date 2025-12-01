<script setup lang="ts">
import type { SliderRootEmits, SliderRootProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<
    SliderRootProps & { class?: HTMLAttributes['class']; variant?: 'default' | 'thin' }
  >(),
  {
    variant: 'default',
  }
)
const emits = defineEmits<SliderRootEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'variant')

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <SliderRoot
    v-slot="{ modelValue }"
    data-slot="slider"
    :class="
      cn(
        'relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
        props.class
      )
    "
    v-bind="forwarded"
  >
    <SliderTrack
      data-slot="slider-track"
      :class="
        cn(
          'relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full',
          props.variant === 'thin'
            ? 'data-[orientation=horizontal]:h-1 data-[orientation=vertical]:w-1'
            : 'data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:w-1.5'
        )
      "
    >
      <SliderRange
        data-slot="slider-range"
        class="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
      />
    </SliderTrack>

    <SliderThumb
      v-for="(_, key) in modelValue"
      :key="key"
      data-slot="slider-thumb"
      :class="
        cn(
          'block shrink-0 rounded-full border border-primary bg-background shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
          props.variant === 'thin' ? 'size-3' : 'size-4'
        )
      "
    />
  </SliderRoot>
</template>
