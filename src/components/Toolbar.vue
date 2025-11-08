<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from '@/components/ui/menubar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCommandStore } from '../stores/commandStore'

// 使用命令系统 Store
const commandStore = useCommandStore()

// 按分类获取命令
const fileCommands = computed(() => commandStore.getCommandsByCategory('file'))
const editCommands = computed(() => commandStore.getCommandsByCategory('edit'))
const viewCommands = computed(() => commandStore.getCommandsByCategory('view'))

// 监控状态
const watchState = computed(() => commandStore.fileOps.watchState)

// AlertDialog 状态
const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogDescription = ref('')

// 执行命令
function handleCommand(commandId: string) {
  commandStore.executeCommand(commandId)
}

// 检查命令是否可用
function isEnabled(commandId: string): boolean {
  return commandStore.isCommandEnabled(commandId)
}

// 处理文件更新通知
function showFileUpdateNotification(fileInfo: { fileName: string; lastModified: number }) {
  dialogTitle.value = '检测到文件更新'
  dialogDescription.value = `文件 ${fileInfo.fileName} 已更新，最后修改时间：${new Date(fileInfo.lastModified).toLocaleString()}。\n\n是否立即导入最新数据？`
  dialogOpen.value = true
}

// 确认导入
function handleConfirmImport() {
  commandStore.fileOps.importFromWatchedFile()
  dialogOpen.value = false
}

// 取消导入
function handleCancelImport() {
  dialogOpen.value = false
}

// 组件挂载时注册回调
onMounted(() => {
  commandStore.setFileUpdateNotification(showFileUpdateNotification)
})
</script>

<template>
  <div class="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
    <!-- Menubar 菜单栏 -->
    <Menubar class="border-none bg-transparent">
      <!-- 文件菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">文件</MenubarTrigger>
        <MenubarContent>
          <template v-for="cmd in fileCommands" :key="cmd.id">
            <!-- 在"导出"、"保存到游戏"、"监控游戏目录"之前添加分隔线 -->
            <MenubarSeparator
              v-if="
                cmd.id === 'file.export' ||
                cmd.id === 'file.saveToGame' ||
                cmd.id === 'file.startWatchMode'
              "
            />
            <MenubarItem :disabled="!isEnabled(cmd.id)" @click="handleCommand(cmd.id)">
              {{ cmd.label }}
              <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>

      <!-- 编辑菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">编辑</MenubarTrigger>
        <MenubarContent>
          <template v-for="cmd in editCommands" :key="cmd.id">
            <!-- 在"删除"之前和"全选"之前添加分隔线 -->
            <MenubarSeparator v-if="cmd.id === 'edit.delete' || cmd.id === 'edit.selectAll'" />
            <MenubarItem :disabled="!isEnabled(cmd.id)" @click="handleCommand(cmd.id)">
              {{ cmd.label }}
              <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>

      <!-- 视图菜单 -->
      <MenubarMenu>
        <MenubarTrigger class="text-sm font-medium">视图</MenubarTrigger>
        <MenubarContent>
          <template v-for="cmd in viewCommands" :key="cmd.id">
            <!-- 在"重置视图"之前添加分隔线 -->
            <MenubarSeparator v-if="cmd.id === 'view.resetView'" />
            <MenubarItem :disabled="!isEnabled(cmd.id)" @click="handleCommand(cmd.id)">
              {{ cmd.label }}
              <MenubarShortcut v-if="cmd.shortcut">{{ cmd.shortcut }}</MenubarShortcut>
            </MenubarItem>
          </template>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>

    <!-- 监控状态指示器 -->
    <div class="flex items-center gap-2">
      <div
        v-if="watchState.isActive"
        class="flex items-center gap-2 rounded-md bg-green-50 px-3 py-1.5"
      >
        <div class="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
        <span class="text-xs font-medium text-green-700">监控中</span>
        <span class="text-xs text-green-600">{{ watchState.dirPath }}</span>
      </div>
    </div>
  </div>

  <!-- 文件更新确认对话框 -->
  <AlertDialog :open="dialogOpen" @update:open="dialogOpen = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ dialogTitle }}</AlertDialogTitle>
        <AlertDialogDescription class="whitespace-pre-line">
          {{ dialogDescription }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="handleCancelImport">稍后</AlertDialogCancel>
        <AlertDialogAction @click="handleConfirmImport">立即导入</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
