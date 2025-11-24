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
 * 3D 坐标系转换工具
 * 处理游戏坐标与 Three.js 世界坐标之间的转换
 *
 * 坐标系映射：
 * 游戏坐标 (x, y, z) = Three.js 世界坐标 (x, y, z)
 * - 现已将 Three.js 全局设置为 Z-up 坐标系，与游戏坐标完全一致
 * - 无需再进行轴交换
 */
export const coordinates3D = {
  /**
   * 游戏坐标转 Three.js 世界坐标
   */
  gameToThree(gamePos: Position3D): Vector3 {
    return new Vector3(gamePos.x, gamePos.y, gamePos.z)
  },

  /**
   * 游戏坐标转 Three.js 世界坐标（原地修改 Vector3）
   */
  gameToThreeMut(gamePos: Position3D, target: Vector3): Vector3 {
    return target.set(gamePos.x, gamePos.y, gamePos.z)
  },

  /**
   * Three.js 世界坐标转游戏坐标
   */
  threeToGame(threePos: Vector3): Position3D {
    return {
      x: threePos.x,
      y: threePos.y,
      z: threePos.z,
    }
  },

  /**
   * 游戏坐标增量转 Three.js 世界坐标增量
   */
  gameDeltaToThreeDelta(gameDelta: Position3D): Position3D {
    return {
      x: gameDelta.x,
      y: gameDelta.y,
      z: gameDelta.z,
    }
  },

  /**
   * Three.js 世界坐标增量转游戏坐标增量
   */
  threeDeltaToGameDelta(threeDelta: Position3D): Position3D {
    return {
      x: threeDelta.x,
      y: threeDelta.y,
      z: threeDelta.z,
    }
  },

  /**
   * 设置 Three.js Vector3 为游戏坐标值
   */
  setThreeFromGame(target: Vector3, gamePos: Position3D): Vector3 {
    return target.set(gamePos.x, gamePos.y, gamePos.z)
  },
}
