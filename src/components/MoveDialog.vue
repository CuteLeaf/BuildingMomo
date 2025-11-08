<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEditorStore } from '../stores/editorStore'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const editorStore = useEditorStore()

// 表单数据
const mode = ref<'relative' | 'absolute'>('relative')

// 位置输入
const posX = ref<string>('')
const posY = ref<string>('')
const posZ = ref<string>('')

// 旋转输入（绕X/Y/Z轴）
const rotX = ref<string>('')
const rotY = ref<string>('')
const rotZ = ref<string>('')

// 计算当前选中物品的中心坐标
const selectedCenter = computed(() => {
  return editorStore.getSelectedItemsCenter()
})

// 显示的提示信息
const centerHint = computed(() => {
  if (mode.value === 'absolute' && selectedCenter.value) {
    const { x, y, z } = selectedCenter.value
    return `当前中心: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`
  }
  return ''
})

// 当对话框打开时，重置表单并填充默认值
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  }
)

// 重置表单
function resetForm() {
  mode.value = 'relative'
  posX.value = ''
  posY.value = ''
  posZ.value = ''
  rotX.value = ''
  rotY.value = ''
  rotZ.value = ''
}

// 解析输入值（允许空值）
function parseInputValue(value: string): number | undefined {
  if (value.trim() === '') return undefined
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

// 验证表单（至少有一个字段有值）
function validateForm(): boolean {
  const hasPosition = !!(posX.value || posY.value || posZ.value)
  const hasRotation = !!(rotX.value || rotY.value || rotZ.value)
  return hasPosition || hasRotation
}

// 确认按钮处理
function handleConfirm() {
  if (!validateForm()) {
    return
  }

  // 解析位置值
  const position =
    posX.value || posY.value || posZ.value
      ? {
          x: parseInputValue(posX.value),
          y: parseInputValue(posY.value),
          z: parseInputValue(posZ.value),
        }
      : undefined

  // 解析旋转值
  const rotation =
    rotX.value || rotY.value || rotZ.value
      ? {
          x: parseInputValue(rotX.value),
          y: parseInputValue(rotY.value),
          z: parseInputValue(rotZ.value),
        }
      : undefined

  // 调用 store 方法
  editorStore.updateSelectedItemsTransform({
    mode: mode.value,
    position,
    rotation,
  })

  // 关闭对话框
  emit('update:open', false)
}

// 取消按钮处理
function handleCancel() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>移动和旋转</DialogTitle>
        <DialogDescription> 设置物品的位置和旋转角度。空值表示保持原值不变。 </DialogDescription>
      </DialogHeader>

      <div class="grid gap-6 py-4">
        <!-- 模式选择 -->
        <div class="grid gap-2">
          <Label>移动模式</Label>
          <RadioGroup v-model="mode">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="relative" value="relative" />
              <Label for="relative" class="cursor-pointer font-normal">
                相对移动（在当前位置基础上偏移）
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="absolute" value="absolute" />
              <Label for="absolute" class="cursor-pointer font-normal">
                绝对移动（移动到指定坐标）
              </Label>
            </div>
          </RadioGroup>
        </div>

        <!-- 位置输入 -->
        <div class="grid gap-3">
          <div class="flex items-center justify-between">
            <Label class="text-base font-medium">位置</Label>
            <span v-if="centerHint" class="text-xs text-muted-foreground">{{ centerHint }}</span>
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="grid gap-1.5">
              <Label for="pos-x" class="text-xs">X</Label>
              <Input
                id="pos-x"
                v-model="posX"
                type="text"
                placeholder="0"
                @keydown.enter="handleConfirm"
              />
            </div>
            <div class="grid gap-1.5">
              <Label for="pos-y" class="text-xs">Y</Label>
              <Input
                id="pos-y"
                v-model="posY"
                type="text"
                placeholder="0"
                @keydown.enter="handleConfirm"
              />
            </div>
            <div class="grid gap-1.5">
              <Label for="pos-z" class="text-xs">Z</Label>
              <Input
                id="pos-z"
                v-model="posZ"
                type="text"
                placeholder="0"
                @keydown.enter="handleConfirm"
              />
            </div>
          </div>
        </div>

        <!-- 旋转输入 -->
        <div class="grid gap-3">
          <Label class="text-base font-medium">旋转</Label>
          <div class="grid grid-cols-3 gap-3">
            <div class="grid gap-1.5">
              <Label for="rot-x" class="text-xs">绕X轴</Label>
              <div class="relative">
                <Input
                  id="rot-x"
                  v-model="rotX"
                  type="text"
                  placeholder="0"
                  class="pr-6"
                  @keydown.enter="handleConfirm"
                />
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground"
                  >°</span
                >
              </div>
            </div>
            <div class="grid gap-1.5">
              <Label for="rot-y" class="text-xs">绕Y轴</Label>
              <div class="relative">
                <Input
                  id="rot-y"
                  v-model="rotY"
                  type="text"
                  placeholder="0"
                  class="pr-6"
                  @keydown.enter="handleConfirm"
                />
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground"
                  >°</span
                >
              </div>
            </div>
            <div class="grid gap-1.5">
              <Label for="rot-z" class="text-xs">绕Z轴</Label>
              <div class="relative">
                <Input
                  id="rot-z"
                  v-model="rotZ"
                  type="text"
                  placeholder="0"
                  class="pr-6"
                  @keydown.enter="handleConfirm"
                />
                <span
                  class="absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground"
                  >°</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">取消</Button>
        <Button @click="handleConfirm" :disabled="!validateForm()">确定</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
