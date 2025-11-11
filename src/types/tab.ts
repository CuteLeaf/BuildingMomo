// 标签类型
export type TabType = 'scheme' | 'doc'

// 标签接口
export interface Tab {
  id: string
  type: TabType
  title: string

  // 方案类型专有字段
  schemeId?: string
}
