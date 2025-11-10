// 家具元数据类型定义

/** 远程数据格式 */
export interface BuildingMomoFurniture {
  v: string
  d: Record<
    string,
    {
      name_cn: string
      name_en: string
      icon: string
    }
  >
}

/** 家具物品信息 */
export interface FurnitureItem {
  name_cn: string
  name_en: string
  icon: string
}

/** IndexedDB 缓存结构 */
export interface FurnitureCache {
  lastFetchTime: number
  data: Record<string, FurnitureItem>
}
