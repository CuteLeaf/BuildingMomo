import type { Ref } from 'vue'

export interface Position {
  x: number
  y: number
}

/**
 * 画布坐标转换工具
 * 用于处理屏幕坐标与 Konva 世界坐标之间的转换
 */
export function useCanvasCoordinates(stageRef: Ref<any>) {
  /**
   * 将屏幕坐标转换为世界坐标
   * @param screenPos 屏幕坐标（像素坐标）
   * @returns 世界坐标（Konva Stage 坐标系）
   */
  function screenToWorld(screenPos: Position): Position {
    const stage = stageRef.value?.getStage()
    if (!stage) {
      return screenPos
    }

    return {
      x: (screenPos.x - stage.x()) / stage.scaleX(),
      y: (screenPos.y - stage.y()) / stage.scaleY(),
    }
  }

  /**
   * 将世界坐标转换为屏幕坐标
   * @param worldPos 世界坐标（Konva Stage 坐标系）
   * @returns 屏幕坐标（像素坐标）
   */
  function worldToScreen(worldPos: Position): Position {
    const stage = stageRef.value?.getStage()
    if (!stage) {
      return worldPos
    }

    return {
      x: worldPos.x * stage.scaleX() + stage.x(),
      y: worldPos.y * stage.scaleY() + stage.y(),
    }
  }

  return {
    screenToWorld,
    worldToScreen,
  }
}
