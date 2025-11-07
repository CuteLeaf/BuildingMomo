// 游戏内物品原始数据结构（对应JSON格式）
export interface GameItem {
  ItemID: number
  InstanceID: number
  Location: {
    X: number
    Y: number
    Z: number
  }
  Rotation: {
    Pitch: number
    Yaw: number
    Roll: number
  }
  Scale: {
    X: number
    Y: number
    Z: number
  }
  GroupID: number
  AttachID: number
  ColorMap?: Record<string, number>
  TempInfo?: Record<string, any>
}

// 应用内部使用的物品数据结构
export interface AppItem {
  internalId: string // 内部唯一ID（用于Vue/Konva key）
  gameId: number // 原始游戏ItemID
  instanceId: number // 原始InstanceID
  x: number // 平面X坐标
  y: number // 平面Y坐标
  z: number // 高度Z坐标
  // 保留原始数据用于导出
  originalData: GameItem
}

// 高度过滤器配置
export interface HeightFilter {
  min: number
  max: number
  currentMin: number
  currentMax: number
}

// JSON文件根结构
export interface GameDataFile {
  NeedRestore?: boolean
  PlaceInfo: GameItem[]
}

// 家园方案（多文档架构）
export interface HomeScheme {
  id: string // 方案唯一ID
  name: string // 方案名称（从文件名提取）
  filePath?: string // 原始文件路径（可选）

  // 每个方案独立的状态
  items: AppItem[]
  heightFilter: HeightFilter
  selectedItemIds: Set<string>
  initialViewConfig?: { scale: number; x: number; y: number }
}
