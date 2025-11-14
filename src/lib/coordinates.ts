import type { Ref } from 'vue'
import { Vector3 } from 'three'

export interface Position2D {
  x: number
  y: number
}

export interface Position3D {
  x: number
  y: number
  z: number
}

/**
 * 2D Canvas 坐标转换工具
 * 用于处理屏幕坐标与 Konva 世界坐标之间的转换
 */
export function createCanvas2DCoordinates(stageRef: Ref<any>) {
  /**
   * 将屏幕坐标转换为世界坐标
   * @param screenPos 屏幕坐标（像素坐标）
   * @returns 世界坐标（Konva Stage 坐标系）
   */
  function screenToWorld(screenPos: Position2D): Position2D {
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
  function worldToScreen(worldPos: Position2D): Position2D {
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

/**
 * 3D 坐标系转换工具
 * 处理游戏坐标与 Three.js 世界坐标之间的转换
 *
 * 坐标系映射：
 * 游戏坐标 (x, y, z) -> Three.js 世界坐标 (x, z, y)
 * - 游戏的 Y 轴（前后）-> Three.js 的 Z 轴
 * - 游戏的 Z 轴（高度）-> Three.js 的 Y 轴
 */
export const coordinates3D = {
  /**
   * 游戏坐标转 Three.js 世界坐标
   */
  gameToThree(gamePos: Position3D): Vector3 {
    return new Vector3(gamePos.x, gamePos.z, gamePos.y)
  },

  /**
   * 游戏坐标转 Three.js 世界坐标（原地修改 Vector3）
   */
  gameToThreeMut(gamePos: Position3D, target: Vector3): Vector3 {
    return target.set(gamePos.x, gamePos.z, gamePos.y)
  },

  /**
   * Three.js 世界坐标转游戏坐标
   */
  threeToGame(threePos: Vector3): Position3D {
    return {
      x: threePos.x,
      y: threePos.z,
      z: threePos.y,
    }
  },

  /**
   * 游戏坐标增量转 Three.js 世界坐标增量
   */
  gameDeltaToThreeDelta(gameDelta: Position3D): Position3D {
    return {
      x: gameDelta.x, // X 轴不变
      y: gameDelta.z, // 游戏的 Z 增量 -> Three.js 的 Y 增量
      z: gameDelta.y, // 游戏的 Y 增量 -> Three.js 的 Z 增量
    }
  },

  /**
   * Three.js 世界坐标增量转游戏坐标增量
   */
  threeDeltaToGameDelta(threeDelta: Position3D): Position3D {
    return {
      x: threeDelta.x, // X 轴不变
      y: threeDelta.z, // Three.js 的 Z 增量 -> 游戏的 Y 增量
      z: threeDelta.y, // Three.js 的 Y 增量 -> 游戏的 Z 增量
    }
  },

  /**
   * 设置 Three.js Vector3 为游戏坐标值
   */
  setThreeFromGame(target: Vector3, gamePos: Position3D): Vector3 {
    return target.set(gamePos.x, gamePos.z, gamePos.y)
  },
}
